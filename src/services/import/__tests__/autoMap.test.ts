/**
 * Tests for autoMapRecords (Story 1.14a, AC3 + AC11).
 *
 * The mapper is the brain of the import pipeline: pure function, schema-
 * aware, fuzzy field matching via Fuse. Heavy test coverage so future
 * schema renames + new sections don't silently regress mapping quality.
 */
import { describe, it, expect } from 'vitest'
import { autoMapRecords } from '../autoMap'
import type { ImportedRecord } from '../ImportSource'
import type { FormSectionSchema } from '@/models/FormSchema'

const peopleSchema: FormSectionSchema = {
  sectionKey: 'people',
  title: 'People',
  isArray: true,
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'tel' },
    { name: 'relationship', type: 'text' },
    { name: 'notes', type: 'textarea' },
  ],
}

const financialAccountsSchema: FormSectionSchema = {
  sectionKey: 'financialAccounts',
  title: 'Financial Accounts',
  isArray: true,
  fields: [
    { name: 'institution', type: 'text', required: true },
    { name: 'accountType', type: 'text' },
    { name: 'accountNumber', type: 'text' },
    { name: 'routingNumber', type: 'text' },
    { name: 'notes', type: 'textarea' },
  ],
}

const registry = { people: peopleSchema, financialAccounts: financialAccountsSchema }

function rec(unmapped: Record<string, string>): ImportedRecord {
  return {
    sourceLabel: 'test',
    proposedSection: null,
    proposedFields: {},
    unmappedFields: { ...unmapped },
    validationIssues: [],
  }
}

describe('autoMapRecords — exact name matches', () => {
  it('maps a record with all-matching field names to the right section', () => {
    const out = autoMapRecords(
      [rec({ name: 'Anna', email: 'anna@example.com', phone: '555-1212' })],
      registry,
    )
    expect(out[0].proposedSection).toBe('people')
    expect(out[0].proposedFields).toEqual({
      name: 'Anna',
      email: 'anna@example.com',
      phone: '555-1212',
    })
    expect(out[0].unmappedFields).toEqual({})
  })

  it('routes a financial-shaped record to financialAccounts', () => {
    const out = autoMapRecords(
      [rec({ institution: 'Chase', accountType: 'Checking', accountNumber: '****1234' })],
      registry,
    )
    expect(out[0].proposedSection).toBe('financialAccounts')
    expect(out[0].proposedFields.institution).toBe('Chase')
  })
})

describe('autoMapRecords — fuzzy name matches', () => {
  it('matches "Email Address" → schema field "email"', () => {
    const out = autoMapRecords(
      [rec({ 'Email Address': 'anna@example.com', Name: 'Anna' })],
      registry,
    )
    expect(out[0].proposedSection).toBe('people')
    expect(out[0].proposedFields.email).toBe('anna@example.com')
    expect(out[0].proposedFields.name).toBe('Anna')
  })

  it('matches "Phone Number" → schema field "phone"', () => {
    const out = autoMapRecords(
      [rec({ Name: 'Anna', 'Phone Number': '555-1212' })],
      registry,
    )
    expect(out[0].proposedFields.phone).toBe('555-1212')
  })
})

describe('autoMapRecords — unmapped collection', () => {
  it('keeps source fields that have no schema match in unmappedFields', () => {
    const out = autoMapRecords(
      [rec({ name: 'Anna', email: 'anna@example.com', customField: 'extra value' })],
      registry,
    )
    expect(out[0].proposedSection).toBe('people')
    expect(out[0].proposedFields.name).toBe('Anna')
    expect(out[0].unmappedFields).toEqual({ customField: 'extra value' })
  })
})

describe('autoMapRecords — low-confidence input', () => {
  it('leaves proposedSection null when fewer than 2 fields match any section', () => {
    const out = autoMapRecords(
      [rec({ name: 'Anna', random123: 'something' })],
      registry,
    )
    // Only one confident match → not enough confidence; user assigns manually.
    expect(out[0].proposedSection).toBeNull()
    // The unmapped fields are preserved as-is.
    expect(out[0].unmappedFields).toEqual({
      name: 'Anna',
      random123: 'something',
    })
  })

  it('returns an empty result on an empty input record', () => {
    const out = autoMapRecords([rec({})], registry)
    expect(out[0].proposedSection).toBeNull()
    expect(out[0].proposedFields).toEqual({})
    expect(out[0].unmappedFields).toEqual({})
  })
})

describe('autoMapRecords — purity', () => {
  it('does not mutate the input records or the registry', () => {
    const input = rec({ name: 'Anna', email: 'anna@example.com' })
    const inputCopy = JSON.parse(JSON.stringify(input))
    const registryCopy = JSON.parse(JSON.stringify(registry))
    autoMapRecords([input], registry)
    expect(input).toEqual(inputCopy)
    expect(registry).toEqual(registryCopy)
  })

  it('is deterministic — same input + registry → identical output', () => {
    const input = [rec({ name: 'Anna', email: 'anna@example.com' })]
    const a = autoMapRecords(input, registry)
    const b = autoMapRecords(input, registry)
    expect(a).toEqual(b)
  })
})
