/**
 * Tests for commitImport (Story 1.14a, AC7 + AC11).
 *
 * The commit engine runs the entire read-modify-write cycle inside a
 * single Dexie `rw` transaction (via `LocalDataStore.updateAtomic`).
 * A throw inside the transaction → IndexedDB rolls back → vault is
 * exactly as it was. Tests pin: merge / add / skip semantics, unmapped
 * → notes appending, and true all-or-nothing rollback.
 */
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { commitImport } from '../commit'
import { LocalDataStore } from '@/services/LocalDataStore'
import type { ImportedRecord, RecordCommitChoice } from '../ImportSource'
import type { DeathboxData } from '@/models/DeathboxData'

function rec(
  section: string | null,
  proposed: Record<string, unknown>,
  unmapped: Record<string, string> = {},
): ImportedRecord {
  return {
    sourceLabel: 'test',
    proposedSection: section,
    proposedFields: proposed,
    unmappedFields: unmapped,
    validationIssues: [],
  }
}

const seedData: DeathboxData = {
  schemaVersion: 1,
  people: [{ id: 'p-existing', name: 'Existing', email: 'existing@example.com' }],
} as any

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  const store = new LocalDataStore()
  await store.delete()
  await store.save(seedData)
})

describe('commitImport — basic add', () => {
  it('adds a new record to an array section', async () => {
    const records = [rec('people', { name: 'Anna', email: 'anna@example.com' })]
    const result = await commitImport(records, [{ choice: 'add' }])
    expect(result.added).toBe(1)
    expect(result.merged).toBe(0)
    expect(result.skipped).toBe(0)
    expect(result.sectionsAffected).toEqual(['people'])
    const loaded = await new LocalDataStore().load()
    expect(loaded?.people).toHaveLength(2)
    expect(loaded?.people?.some((p: any) => p.name === 'Anna')).toBe(true)
  })

  it('preserves existing records in the section', async () => {
    const records = [rec('people', { name: 'Anna' })]
    await commitImport(records, [{ choice: 'add' }])
    const loaded = await new LocalDataStore().load()
    expect(loaded?.people?.some((p: any) => p.id === 'p-existing')).toBe(true)
  })
})

describe('commitImport — skip', () => {
  it('writes nothing when choice is skip', async () => {
    const records = [rec('people', { name: 'Anna' })]
    await commitImport(records, [{ choice: 'skip' }])
    const loaded = await new LocalDataStore().load()
    expect(loaded?.people).toHaveLength(1)
    expect(loaded?.people?.[0].name).toBe('Existing')
  })
})

describe('commitImport — merge', () => {
  it('shallow-merges proposed fields into the matched existing record', async () => {
    const records = [
      rec('people', { name: 'Existing', email: 'updated@example.com', phone: '555-1212' }),
    ]
    const result = await commitImport(records, [
      { choice: 'merge', mergeTargetId: 'p-existing' },
    ])
    expect(result.merged).toBe(1)
    const loaded = await new LocalDataStore().load()
    expect(loaded?.people).toHaveLength(1)
    expect((loaded?.people?.[0] as any).email).toBe('updated@example.com')
    expect((loaded?.people?.[0] as any).phone).toBe('555-1212')
    expect((loaded?.people?.[0] as any).id).toBe('p-existing')
  })

  it('falls through to add when mergeTargetId does not match', async () => {
    const records = [rec('people', { name: 'Anna' })]
    const result = await commitImport(records, [
      { choice: 'merge', mergeTargetId: 'p-nope' },
    ])
    expect(result.added).toBe(1)
    expect(result.merged).toBe(0)
  })
})

describe('commitImport — unmapped → notes', () => {
  it('appends stringified unmapped fields to the new record notes', async () => {
    const records = [
      rec(
        'people',
        { name: 'Anna' },
        { tagFromCsv: 'volunteer', anotherCustomField: 'value-x' },
      ),
    ]
    await commitImport(records, [{ choice: 'add' }])
    const loaded = await new LocalDataStore().load()
    const anna = loaded?.people?.find((p: any) => p.name === 'Anna') as any
    expect(anna.notes).toContain('tagFromCsv: volunteer')
    expect(anna.notes).toContain('anotherCustomField: value-x')
  })

  it('appends unmapped fields to existing notes on merge', async () => {
    const seedWithNotes: DeathboxData = {
      schemaVersion: 1,
      people: [{ id: 'p1', name: 'Anna', notes: 'Original note.' }],
    } as any
    const store = new LocalDataStore()
    await store.delete()
    await store.save(seedWithNotes)
    const records = [
      rec(
        'people',
        { name: 'Anna' },
        { tag: 'imported-2026' },
      ),
    ]
    await commitImport(records, [{ choice: 'merge', mergeTargetId: 'p1' }])
    const loaded = await store.load()
    const anna = loaded?.people?.find((p: any) => p.name === 'Anna') as any
    expect(anna.notes).toContain('Original note.')
    expect(anna.notes).toContain('tag: imported-2026')
  })
})

describe('commitImport — id generation', () => {
  it('generates a stable id on every new array-section record', async () => {
    const records = [rec('people', { name: 'Anna' })]
    await commitImport(records, [{ choice: 'add' }])
    const loaded = await new LocalDataStore().load()
    const anna = loaded?.people?.find((p: any) => p.name === 'Anna') as any
    expect(typeof anna.id).toBe('string')
    expect(anna.id.length).toBeGreaterThan(0)
  })

  it('preserves an explicit id on the proposed fields when present', async () => {
    const records = [rec('people', { id: 'p-custom-1', name: 'Anna' })]
    await commitImport(records, [{ choice: 'add' }])
    const loaded = await new LocalDataStore().load()
    const anna = loaded?.people?.find((p: any) => p.id === 'p-custom-1') as any
    expect(anna.name).toBe('Anna')
  })
})

describe('commitImport — all-or-nothing', () => {
  it('writes everything when every record is valid', async () => {
    const records = [
      rec('people', { name: 'Anna' }),
      rec('people', { name: 'Linda' }),
      rec('people', { name: 'Mike' }),
    ]
    const choices: { choice: RecordCommitChoice }[] = [
      { choice: 'add' },
      { choice: 'add' },
      { choice: 'add' },
    ]
    const result = await commitImport(records, choices)
    expect(result.added).toBe(3)
    const loaded = await new LocalDataStore().load()
    expect(loaded?.people).toHaveLength(4)
  })

  it('rejects the entire commit when the choices array length mismatches', async () => {
    const records = [rec('people', { name: 'Anna' })]
    await expect(
      commitImport(records, [
        { choice: 'add' },
        { choice: 'add' },
      ]),
    ).rejects.toThrow()
    const loaded = await new LocalDataStore().load()
    expect(loaded?.people).toHaveLength(1) // unchanged
  })
})

describe('commitImport — result shape', () => {
  it('reports the affected sections deduplicated and sorted', async () => {
    const records = [
      rec('people', { name: 'Anna' }),
      rec('people', { name: 'Linda' }),
    ]
    const result = await commitImport(records, [
      { choice: 'add' },
      { choice: 'add' },
    ])
    expect(result.sectionsAffected).toEqual(['people'])
  })

  it('handles a record with no proposedSection by skipping it', async () => {
    const records = [
      rec(null, { name: 'Anna' }),
      rec('people', { name: 'Linda' }),
    ]
    const result = await commitImport(records, [
      { choice: 'add' },
      { choice: 'add' },
    ])
    expect(result.added).toBe(1)
    expect(result.skipped).toBe(1)
  })
})
