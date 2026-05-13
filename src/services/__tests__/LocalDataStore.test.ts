/**
 * LocalDataStore integration tests (Story 1.9 + 1.10 audit).
 *
 * Exercises the full export → wipe → import → load round-trip through the
 * LocalDataStore class, NOT just the encryption primitives in isolation
 * (those are covered by `src/utils/__tests__/encryption.test.ts`).
 *
 * The fake-indexeddb polyfill is installed via the side-effect import at
 * the top of the file — Dexie needs a real IndexedDB, jsdom doesn't ship
 * one. The polyfill resets per-test via the `IDBFactory` reset trick;
 * otherwise the same in-memory database persists across tests in the same
 * file run.
 */
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { LocalDataStore } from '../LocalDataStore'
import { isEncrypted } from '@/utils/encryption'
import type { DeathboxData } from '@/models/DeathboxData'

function makeFixture(): DeathboxData {
  // Representative vault — a few people, one financial account, some
  // notes. Enough variety to exercise serialization without being huge.
  return {
    schemaVersion: 1,
    updatedAt: new Date('2026-01-15T10:00:00Z').toISOString(),
    people: [
      {
        id: 'p1',
        firstName: 'Anna',
        lastName: 'Voss',
        email: 'anna@example.com',
        phone: '+1-512-555-0100',
      },
    ],
    financialAccounts: [
      {
        id: 'fa1',
        institutionName: 'First Federal',
        accountNumber: '0001-2345-6789',
        accountType: 'checking',
      },
    ],
    notes: 'Test vault for round-trip integration test.',
  } as unknown as DeathboxData
}

beforeEach(async () => {
  // Reset the in-memory IndexedDB between tests so each starts fresh.
  // Dexie keeps an open connection to the existing database, so just
  // swapping the factory isn't enough — also call `delete()` through
  // a LocalDataStore to clear the row out of Dexie's cached DB instance.
  globalThis.indexedDB = new IDBFactory()
  await new LocalDataStore().delete()
})

describe('LocalDataStore — encrypted export/import round-trip (Story 1.9 + 1.10)', () => {
  it('round-trips a vault through exportToJSON + importFromJSON with a password', async () => {
    const store = new LocalDataStore()
    const original = makeFixture()
    await store.save(original)

    const exported = await store.exportToJSON('correct-horse-battery-staple')
    expect(isEncrypted(exported)).toBe(true)

    // Wipe.
    await store.delete()
    expect(await store.load()).toBeNull()

    // Restore from encrypted export.
    await store.importFromJSON(exported, 'correct-horse-battery-staple')

    const restored = await store.load()
    expect(restored).toBeTruthy()
    expect(restored!.people).toEqual(original.people)
    expect(restored!.financialAccounts).toEqual(original.financialAccounts)
    // `updatedAt` is re-stamped by save() on the import path — verify it
    // moves forward (or equals — same-millisecond timing under fake
    // timers), not back.
    expect(new Date(restored!.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(original.updatedAt).getTime(),
    )
  })

  it('exportToJSON without a password returns plaintext JSON', async () => {
    const store = new LocalDataStore()
    await store.save(makeFixture())

    const exported = await store.exportToJSON()
    expect(isEncrypted(exported)).toBe(false)
    // Plaintext should parse as JSON containing the vault shape.
    const parsed = JSON.parse(exported)
    expect(parsed.schemaVersion).toBe(1)
    expect(parsed.people).toHaveLength(1)
  })

  it('importFromJSON without password rejects encrypted input with a clear error', async () => {
    const store = new LocalDataStore()
    await store.save(makeFixture())
    const encrypted = await store.exportToJSON('some-password')

    // Wipe so the import has somewhere to go.
    await store.delete()

    await expect(store.importFromJSON(encrypted)).rejects.toThrow(
      /encrypted.*provide a password/i,
    )
  })

  it('importFromJSON with WRONG password rejects with the canonical error', async () => {
    const store = new LocalDataStore()
    await store.save(makeFixture())
    const encrypted = await store.exportToJSON('correct-password')

    await store.delete()

    await expect(
      store.importFromJSON(encrypted, 'wrong-password'),
    ).rejects.toThrow(/Decryption failed/i)
  })

  it('importFromJSON of plaintext (no password) restores the vault', async () => {
    const store = new LocalDataStore()
    await store.save(makeFixture())
    const plaintext = await store.exportToJSON() // no password

    await store.delete()
    await store.importFromJSON(plaintext)

    const restored = await store.load()
    expect(restored?.people).toHaveLength(1)
    expect(restored?.financialAccounts).toHaveLength(1)
  })

  it('exportToJSON of an empty store returns "null" JSON string', async () => {
    // Boundary case — the store was never saved. `load()` returns null;
    // `JSON.stringify(null)` is `"null"`. Just pin the behavior so a
    // future regression to a thrown error is caught.
    const store = new LocalDataStore()
    const exported = await store.exportToJSON()
    expect(exported).toBe('null')
  })
})
