/**
 * Migration rollback + restore (Story 1.13 AC7).
 *
 * Exercises the `applyMigrations()` flow in `LocalDataStore` with
 * test-only migrations pushed into `MIGRATIONS` per-test.
 *
 * Uses `fake-indexeddb` (installed in Story 1.9/1.10 audit) so the Dexie
 * rollback table is real. Direct peeks into the database use a separate
 * Dexie instance to avoid depending on the SUT's load() path.
 */
import 'fake-indexeddb/auto'
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import Dexie from 'dexie'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { LocalDataStore } from '@/services/LocalDataStore'
import {
  LoadRequiresManualImportError,
  MigrationFailedError,
} from '@/services/errors'
import {
  MIGRATIONS,
  CURRENT_SCHEMA_VERSION,
} from '@/migrations'

const v1Fixture = JSON.parse(
  readFileSync(resolve(__dirname, '../../../tests/fixtures/v1.json'), 'utf-8'),
) as { schemaVersion: number; [k: string]: unknown }

/** Open a peek-only handle to the same DB to inspect rows without going through the SUT. */
async function openPeekDb(): Promise<Dexie> {
  const peek = new Dexie('LegacyVaultDB')
  // Match the production schema version chain so Dexie doesn't throw
  // `VersionError` when the SUT has already bumped the DB to v3
  // (Story 1.7 attachments).
  peek.version(1).stores({ data: 'id' })
  peek.version(2).stores({ data: 'id', rollback: 'key' })
  peek.version(3).stores({ data: 'id', rollback: 'key', attachments: 'id' })
  await peek.open()
  return peek
}

async function peekDataRow(): Promise<any> {
  const peek = await openPeekDb()
  try {
    const row = await peek.table('data').get('main')
    return row?.data ?? null
  } finally {
    peek.close()
  }
}

async function peekRollbackRow(fromVersion: number): Promise<any> {
  const peek = await openPeekDb()
  try {
    const row = await peek.table('rollback').get(`rollback_v${fromVersion}`)
    return row ?? null
  } finally {
    peek.close()
  }
}

async function wipeBothTables(): Promise<void> {
  const peek = await openPeekDb()
  try {
    await peek.table('data').clear()
    await peek.table('rollback').clear()
  } finally {
    peek.close()
  }
}

beforeEach(async () => {
  // Fresh IDB instance, but Dexie holds an open connection — wipe via
  // a side Dexie instance to clear both tables.
  globalThis.indexedDB = new IDBFactory()
  await wipeBothTables().catch(() => {
    // First-time setup may need to create the DB; ignore.
  })
})

afterEach(() => {
  MIGRATIONS.length = 0
  vi.restoreAllMocks()
})

describe('rollback: pre-migration row is written + cleaned up on success', () => {
  it('successful v0→v1 migration leaves no rollback row behind', async () => {
    MIGRATIONS.push({
      fromVersion: 0,
      toVersion: 1,
      migrate: data => ({ ...data, addedFlag: true }),
    })
    const store = new LocalDataStore()
    await store.save({ ...v1Fixture, schemaVersion: 0 } as any)

    const loaded = await store.load()
    expect(loaded).toBeTruthy()
    expect(loaded!.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect((loaded as any).addedFlag).toBe(true)

    // Rollback row cleaned up.
    const rollback = await peekRollbackRow(0)
    expect(rollback).toBeNull()
  })
})

describe('rollback: restore when migration throws', () => {
  it('restores from rollback + throws MigrationFailedError', async () => {
    MIGRATIONS.push({
      fromVersion: 0,
      toVersion: 1,
      migrate: () => {
        throw new Error('Simulated migration failure')
      },
    })
    const store = new LocalDataStore()
    const originalData = { ...v1Fixture, schemaVersion: 0 } as any
    await store.save(originalData)

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(store.load()).rejects.toBeInstanceOf(MigrationFailedError)
    consoleSpy.mockRestore()

    // Peek the live data row directly — should be the pre-migration v0 shape.
    const restored = await peekDataRow()
    expect(restored).toBeTruthy()
    expect(restored.schemaVersion).toBe(0)
    expect(Array.isArray(restored.people)).toBe(true)
  })
})

describe('rollback: restore when post-migration validation fails', () => {
  it('restores from rollback when a migration silently flips an array to an object', async () => {
    MIGRATIONS.push({
      fromVersion: 0,
      toVersion: 1,
      migrate: data => ({
        ...data,
        people: { not: 'an-array-anymore' },
      }),
    })
    const store = new LocalDataStore()
    await store.save({ ...v1Fixture, schemaVersion: 0 } as any)

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(store.load()).rejects.toBeInstanceOf(MigrationFailedError)
    consoleSpy.mockRestore()

    // Peek directly — original v0 shape with `people` as an array.
    const restored = await peekDataRow()
    expect(restored.schemaVersion).toBe(0)
    expect(Array.isArray(restored.people)).toBe(true)
  })
})

describe('rollback: hard refuse when rollback row is missing', () => {
  it('throws LoadRequiresManualImportError when migration fails AND rollback write fails', async () => {
    MIGRATIONS.push({
      fromVersion: 0,
      toVersion: 1,
      migrate: () => {
        throw new Error('Simulated migration failure')
      },
    })
    const store = new LocalDataStore()
    await store.save({ ...v1Fixture, schemaVersion: 0 } as any)

    // Patch put() to throw on the `rollback` store so the framework can't
    // write a rollback row. The migration then throws + the restore path
    // finds no rollback → LoadRequiresManualImportError.
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const originalPut = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (this: IDBObjectStore, ...args: unknown[]) {
      if (this.name === 'rollback') {
        throw new DOMException('simulated rollback write failure', 'UnknownError')
      }
      return (originalPut as (...a: unknown[]) => unknown).apply(this, args)
    }

    try {
      await expect(store.load()).rejects.toBeInstanceOf(
        LoadRequiresManualImportError,
      )
    } finally {
      IDBObjectStore.prototype.put = originalPut
      consoleSpy.mockRestore()
    }
  })
})

describe('idempotency at the data layer (Story 1.13 AC1)', () => {
  it('no-op load → load → load preserves data', async () => {
    const store = new LocalDataStore()
    await store.save(v1Fixture as any)
    const a = await store.load()
    const b = await store.load()
    const c = await store.load()
    expect(a).toEqual(b)
    expect(b).toEqual(c)
  })
})
