/**
 * Round-trip integration test (Story 1.14a, AC9 + AC11).
 *
 * Pins the full contract: CSV → auto-map → validate → commit → encrypted
 * export → wipe → encrypted import → load. Imported data survives a full
 * export/import cycle through the encrypted JSON path. Any silent
 * drift in the export envelope or migration framework would break this.
 */
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { CsvImportSource } from '../CsvImportSource'
import { autoMapRecords } from '../autoMap'
import { validateRecords } from '../validate'
import { commitImport } from '../commit'
import { LocalDataStore } from '@/services/LocalDataStore'
import { schemaRegistry } from '@/schemas'

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  await new LocalDataStore().delete()
})

describe('Import → export → wipe → import round-trip', () => {
  it('CSV-imported records survive a full encrypted-JSON round trip', async () => {
    // 1. Seed an empty vault (a fresh install).
    const store = new LocalDataStore()
    await store.save({ schemaVersion: 1 } as any)

    // 2. Parse a CSV with multiple people.
    // CSV uses `name, email, phone, address` — fields that match `people`
    // strongly but don't trigger `beneficiaries` (which expects
    // `relationship` / `percentage` / `type`). Choosing a CSV that
    // routes unambiguously pins this test against incidental schema-
    // overlap drift.
    const csv = [
      'name,email,phone,address',
      'Anna,anna@example.com,555-1111,123 Main St',
      'Linda,linda@example.com,555-2222,456 Oak Ave',
      'Mike,mike@example.com,555-3333,789 Pine Rd',
    ].join('\n')
    const records = await new CsvImportSource().parse(csv)
    expect(records).toHaveLength(3)

    // 3. Auto-map + validate.
    const mapped = autoMapRecords(records, schemaRegistry)
    const validated = validateRecords(mapped, schemaRegistry)
    // Every record should have been routed to `people`.
    for (const r of validated) {
      expect(r.proposedSection).toBe('people')
      expect(r.validationIssues.filter(i => i.severity === 'error')).toHaveLength(0)
    }

    // 4. Commit.
    const result = await commitImport(
      validated,
      validated.map(() => ({ choice: 'add' as const })),
    )
    expect(result.added).toBe(3)

    // 5. Encrypted export.
    const password = 'round-trip-test-password-2026'
    const encryptedJson = await store.exportToJSON(password)
    expect(encryptedJson.length).toBeGreaterThan(0)

    // 6. Wipe everything.
    await store.delete()
    const wiped = await store.load()
    expect(wiped).toBeNull()

    // 7. Re-import the encrypted JSON.
    await store.importFromJSON(encryptedJson, password)

    // 8. Load and verify all 3 imported records survived.
    const restored = await store.load()
    expect(restored).toBeTruthy()
    expect(restored!.people).toHaveLength(3)
    const annaRestored = restored!.people?.find((p: any) => p.name === 'Anna') as any
    expect(annaRestored.email).toBe('anna@example.com')
    expect(annaRestored.phone).toBe('555-1111')
    expect(annaRestored.address).toBe('123 Main St')
  })

  it('unmapped CSV fields survive in the notes field through the round trip', async () => {
    const store = new LocalDataStore()
    await store.save({ schemaVersion: 1 } as any)

    // CSV with extra columns that won't map to the people schema.
    const csv = [
      'name,email,customTag,birthYear',
      'Anna,anna@example.com,close-friend,1985',
    ].join('\n')
    const records = await new CsvImportSource().parse(csv)
    const mapped = autoMapRecords(records, schemaRegistry)
    const validated = validateRecords(mapped, schemaRegistry)
    await commitImport(validated, [{ choice: 'add' }])

    const password = 'unmapped-roundtrip-pwd'
    const encrypted = await store.exportToJSON(password)
    await store.delete()
    await store.importFromJSON(encrypted, password)

    const restored = await store.load()
    const anna = restored!.people?.find((p: any) => p.name === 'Anna') as any
    expect(anna.notes).toContain('customTag: close-friend')
    expect(anna.notes).toContain('birthYear: 1985')
  })
})
