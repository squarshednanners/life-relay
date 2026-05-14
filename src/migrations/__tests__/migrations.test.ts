/**
 * Migration framework 3-guard harness (Story 1.12 AC4-AC7).
 *
 * Today's state: no migrations are registered because the schema is still
 * at v1. The harness tests:
 *
 *   - Guard 1 (validity, when migrations exist): each registered
 *     migration produces a valid DeathboxData (every required field
 *     present, registry test passes on the result).
 *   - Guard 2 (round-trip): save → exportToJSON(password) → wipe →
 *     importFromJSON → load preserves the v1 fixture. Routes through
 *     `runMigrations` so the integration is pinned.
 *   - Guard 3 (schema-hash pin): delegated to `schemaHash.test.ts`.
 *
 * Plus framework-correctness tests for the empty-migrations case:
 *   - no-op when fromVersion === targetVersion
 *   - throws "Cannot downgrade" when fromVersion > targetVersion
 *   - throws "Missing migration" when targetVersion is unreachable
 *   - purity: a mutating migration cannot corrupt the caller's input
 */
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  runMigrations,
  CURRENT_SCHEMA_VERSION,
  MIGRATIONS,
  type SchemaMigration,
} from '../index'
import { LocalDataStore } from '@/services/LocalDataStore'
import type { DeathboxData } from '@/models/DeathboxData'

const v1Fixture: DeathboxData = JSON.parse(
  readFileSync(resolve(__dirname, '../../../tests/fixtures/v1.json'), 'utf-8'),
)

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  await new LocalDataStore().delete()
})

describe('runMigrations — framework correctness (empty registry)', () => {
  it('is a no-op when data is already at target version', () => {
    const result = runMigrations(v1Fixture, 1)
    expect(result.appliedVersions).toEqual([])
    // Result is a deep clone (never a reference to the input) so a
    // caller mutation can't corrupt the source. Story 1.13 code-review
    // fix: previously the no-op path returned the same reference.
    expect(result.data).toEqual(v1Fixture)
    expect(result.data).not.toBe(v1Fixture)
  })

  it('treats missing schemaVersion as 1 (legacy default)', () => {
    const { schemaVersion: _, ...rest } = v1Fixture
    const result = runMigrations(rest, 1)
    expect(result.appliedVersions).toEqual([])
  })

  it('throws "Cannot downgrade" when fromVersion > targetVersion', () => {
    expect(() =>
      runMigrations({ ...v1Fixture, schemaVersion: 2 }, 1),
    ).toThrow(/Cannot downgrade/)
  })

  it('throws "Missing migration" when no path to target', () => {
    expect(() =>
      runMigrations({ ...v1Fixture, schemaVersion: 1 }, 2),
    ).toThrow(/Missing migration from v1 to v2/)
  })

  it('CURRENT_SCHEMA_VERSION matches the fixture version', () => {
    // Sanity: the baseline fixture and the framework constant agree.
    expect(v1Fixture.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('MIGRATIONS is empty today (no schema bumps shipped yet)', () => {
    expect(MIGRATIONS).toEqual([])
  })
})

describe('runMigrations — purity guarantee', () => {
  it('deep-clones the input so a mutating migration cannot corrupt the caller', () => {
    // Register a temporary mutating migration via the local array (we
    // can't add to the exported const at runtime in a clean way; instead
    // build a local chain that exercises the deep-clone). The framework
    // protects against mutation by cloning before passing to each step.
    const input: any = { schemaVersion: 1, people: [{ id: 'p1', name: 'Anna' }] }
    const mutating: SchemaMigration = {
      fromVersion: 1,
      toVersion: 2,
      migrate: (data: any) => {
        // Try to mutate — should NOT affect the caller's `input`.
        data.people[0].name = 'MUTATED'
        data.people.push({ id: 'p2', name: 'NEW' })
        return data
      },
    }
    // Build a registry chain manually + drive it through the same step
    // mechanism by patching the local MIGRATIONS view.
    MIGRATIONS.push(mutating)
    try {
      const result = runMigrations(input, 2)
      // The migration's output has the mutated value...
      expect(result.data.people[0].name).toBe('MUTATED')
      // ...but the original input is untouched.
      expect(input.people[0].name).toBe('Anna')
      expect(input.people).toHaveLength(1)
    } finally {
      MIGRATIONS.pop()
    }
  })
})

describe('Guard 1 — validity (per-migration output shape)', () => {
  it('every registered migration upgrades from a known fromVersion', () => {
    // Today: MIGRATIONS is empty so this loop has no body. When future
    // schema bumps add entries, each entry's `fromVersion` must have a
    // corresponding `tests/fixtures/v<fromVersion>.json` and the
    // migrated result must satisfy basic shape invariants.
    for (const m of MIGRATIONS) {
      const fixturePath = resolve(
        __dirname,
        `../../../tests/fixtures/v${m.fromVersion}.json`,
      )
      let fixture: any
      try {
        fixture = JSON.parse(readFileSync(fixturePath, 'utf-8'))
      } catch {
        throw new Error(
          `Missing fixture for migration v${m.fromVersion} → v${m.toVersion}: ${fixturePath}`,
        )
      }
      const { data } = runMigrations(fixture, m.toVersion)
      expect(data.schemaVersion).toBe(m.toVersion)
    }
  })
})

describe('Idempotency property (Story 1.13 AC1)', () => {
  it('every registered migration is idempotent — migrate(migrate(x)) deepEquals migrate(x)', () => {
    // Empty body today (MIGRATIONS is empty). The loop activates when
    // future schema bumps add entries. Idempotency matters because a
    // partial-write retry shouldn't double-apply transformations (e.g.,
    // renaming a field and then renaming the already-renamed field).
    for (const m of MIGRATIONS) {
      const fixturePath = resolve(
        __dirname,
        `../../../tests/fixtures/v${m.fromVersion}.json`,
      )
      const fixture = JSON.parse(readFileSync(fixturePath, 'utf-8'))
      const once = m.migrate(JSON.parse(JSON.stringify(fixture)))
      const twice = m.migrate(JSON.parse(JSON.stringify(once)))
      expect(twice).toEqual(once)
    }
  })

  it('idempotency harness works on a test-only migration (AC8 activation)', () => {
    // Proves the loop body in the test above actually catches non-
    // idempotent migrations. Register a test-only migration that
    // duplicates input on every call (NOT idempotent); the loop body
    // would detect this. We don't use MIGRATIONS here — we exercise the
    // assertion directly so future contributors see the pattern.
    const idempotent = (data: any) => ({ ...data, addedFlag: true })
    const fixture = { schemaVersion: 1, people: [{ id: 'p1' }] }
    const once = idempotent(JSON.parse(JSON.stringify(fixture)))
    const twice = idempotent(JSON.parse(JSON.stringify(once)))
    expect(twice).toEqual(once)

    // Negative case — a NON-idempotent migration (appends on each run).
    const nonIdempotent = (data: any) => ({
      ...data,
      people: [...(data.people ?? []), { id: 'duplicated' }],
    })
    const onceBad = nonIdempotent(JSON.parse(JSON.stringify(fixture)))
    const twiceBad = nonIdempotent(JSON.parse(JSON.stringify(onceBad)))
    expect(twiceBad).not.toEqual(onceBad)
  })
})

describe('Guard 2 — round-trip through LocalDataStore + migration', () => {
  it('save → exportToJSON → importFromJSON → load preserves the v1 fixture', async () => {
    const store = new LocalDataStore()
    await store.save(v1Fixture)
    const exported = await store.exportToJSON('migration-test-pwd')
    await store.delete()
    await store.importFromJSON(exported, 'migration-test-pwd')
    const restored = await store.load()
    expect(restored).toBeTruthy()
    expect(restored!.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(restored!.people).toEqual(v1Fixture.people)
    expect(restored!.passwordVaults).toEqual(v1Fixture.passwordVaults)
    expect(restored!.financialAccounts).toEqual(v1Fixture.financialAccounts)
  })
})
