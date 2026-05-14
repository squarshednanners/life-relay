/**
 * Tests for detectDuplicates (Story 1.14a, AC4 merge-prompt support + AC11).
 */
import { describe, it, expect } from 'vitest'
import { detectDuplicates } from '../dedup'
import type { ImportedRecord } from '../ImportSource'
import type { DeathboxData } from '@/models/DeathboxData'

function rec(section: string | null, fields: Record<string, unknown>): ImportedRecord {
  return {
    sourceLabel: 'test',
    proposedSection: section,
    proposedFields: fields,
    unmappedFields: {},
    validationIssues: [],
  }
}

const existing: Partial<DeathboxData> = {
  people: [
    { id: 'p1', name: 'Anna', email: 'anna@example.com' },
    { id: 'p2', name: 'Mike', email: 'mike@example.com' },
  ] as any,
  financialAccounts: [
    { id: 'f1', institution: 'Chase', accountType: 'Checking' },
  ] as any,
}

describe('detectDuplicates', () => {
  it('returns an empty map when no duplicates exist', () => {
    const records = [rec('people', { name: 'Linda', email: 'linda@example.com' })]
    const map = detectDuplicates(records, existing as DeathboxData)
    expect(map.size).toBe(0)
  })

  it('flags an exact name match against an existing person', () => {
    const records = [rec('people', { name: 'Anna' })]
    const map = detectDuplicates(records, existing as DeathboxData)
    expect(map.get(0)).toHaveLength(1)
    expect((map.get(0)![0] as any).id).toBe('p1')
  })

  it('matches case-insensitively', () => {
    const records = [rec('people', { name: 'anna' })]
    const map = detectDuplicates(records, existing as DeathboxData)
    expect(map.get(0)).toHaveLength(1)
  })

  it('trims whitespace before comparing', () => {
    const records = [rec('people', { name: '  Anna  ' })]
    const map = detectDuplicates(records, existing as DeathboxData)
    expect(map.get(0)).toHaveLength(1)
  })

  it('uses institution as the dedup key for financialAccounts', () => {
    const records = [rec('financialAccounts', { institution: 'Chase' })]
    const map = detectDuplicates(records, existing as DeathboxData)
    expect(map.get(0)).toHaveLength(1)
  })

  it('skips records with no target section', () => {
    const records = [rec(null, { name: 'Anna' })]
    const map = detectDuplicates(records, existing as DeathboxData)
    expect(map.size).toBe(0)
  })

  it('skips records with no recognizable dedup field', () => {
    const records = [rec('people', { email: 'unknown@example.com' })]
    const map = detectDuplicates(records, existing as DeathboxData)
    // Name not provided → no dedup attempt (we don't claim email is unique enough).
    expect(map.size).toBe(0)
  })

  it('returns multiple matches when the existing data has duplicates of its own', () => {
    const dupExisting = {
      people: [
        { id: 'p1', name: 'Anna' },
        { id: 'p2', name: 'Anna' },
      ],
    } as any
    const records = [rec('people', { name: 'Anna' })]
    const map = detectDuplicates(records, dupExisting as DeathboxData)
    expect(map.get(0)).toHaveLength(2)
  })

  it('handles a missing section on the data object (fresh vault)', () => {
    const records = [rec('people', { name: 'Anna' })]
    const map = detectDuplicates(records, {} as DeathboxData)
    expect(map.size).toBe(0)
  })
})
