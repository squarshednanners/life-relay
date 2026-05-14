/**
 * Tests for validateRecords (Story 1.14a, AC6 + AC11).
 *
 * Validators run on auto-mapped records against the chosen schema's field
 * rules. Records with any 'error' severity issue can't commit until the
 * user fixes them inline (or skips the row).
 */
import { describe, it, expect } from 'vitest'
import { validateRecords } from '../validate'
import type { ImportedRecord } from '../ImportSource'
import type { FormSectionSchema } from '@/models/FormSchema'

const peopleSchema: FormSectionSchema = {
  sectionKey: 'people',
  title: 'People',
  isArray: true,
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email' },
    { name: 'age', type: 'number', validation: { min: 0, max: 150 } },
    { name: 'phone', type: 'tel' },
    {
      name: 'ssn',
      type: 'text',
      validation: { pattern: '^\\d{3}-\\d{2}-\\d{4}$', message: 'SSN must be ###-##-####' },
    },
  ],
}

const registry = { people: peopleSchema }

function rec(
  proposedSection: string | null,
  proposedFields: Record<string, unknown>,
): ImportedRecord {
  return {
    sourceLabel: 'test',
    proposedSection,
    proposedFields,
    unmappedFields: {},
    validationIssues: [],
  }
}

describe('validateRecords — required', () => {
  it('reports an error when a required field is missing', () => {
    const out = validateRecords([rec('people', { email: 'a@b.c' })], registry)
    expect(out[0].validationIssues).toHaveLength(1)
    expect(out[0].validationIssues[0]).toMatchObject({
      fieldName: 'name',
      severity: 'error',
    })
  })

  it('does NOT report an error when the required field is present', () => {
    const out = validateRecords([rec('people', { name: 'Anna' })], registry)
    expect(out[0].validationIssues.filter(i => i.severity === 'error')).toHaveLength(0)
  })

  it('treats empty-string values as missing for required fields', () => {
    const out = validateRecords([rec('people', { name: '   ' })], registry)
    expect(out[0].validationIssues.some(i => i.fieldName === 'name' && i.severity === 'error')).toBe(true)
  })
})

describe('validateRecords — pattern', () => {
  it('reports an error when a value fails the regex pattern', () => {
    const out = validateRecords(
      [rec('people', { name: 'Anna', ssn: 'not-an-ssn' })],
      registry,
    )
    const sslIssue = out[0].validationIssues.find(i => i.fieldName === 'ssn')
    expect(sslIssue?.severity).toBe('error')
  })

  it('accepts a value that matches the regex pattern', () => {
    const out = validateRecords(
      [rec('people', { name: 'Anna', ssn: '123-45-6789' })],
      registry,
    )
    expect(out[0].validationIssues.find(i => i.fieldName === 'ssn')).toBeUndefined()
  })

  it('skips pattern validation when the value is empty (not required)', () => {
    const out = validateRecords(
      [rec('people', { name: 'Anna', ssn: '' })],
      registry,
    )
    expect(out[0].validationIssues.find(i => i.fieldName === 'ssn')).toBeUndefined()
  })
})

describe('validateRecords — min/max', () => {
  it('reports an error when a number is out of range (low)', () => {
    const out = validateRecords(
      [rec('people', { name: 'Anna', age: -5 })],
      registry,
    )
    expect(out[0].validationIssues.some(i => i.fieldName === 'age' && i.severity === 'error')).toBe(true)
  })

  it('reports an error when a number is out of range (high)', () => {
    const out = validateRecords(
      [rec('people', { name: 'Anna', age: 300 })],
      registry,
    )
    expect(out[0].validationIssues.some(i => i.fieldName === 'age' && i.severity === 'error')).toBe(true)
  })

  it('coerces a numeric string and accepts it when in range', () => {
    const out = validateRecords(
      [rec('people', { name: 'Anna', age: '42' })],
      registry,
    )
    expect(out[0].validationIssues.find(i => i.fieldName === 'age')).toBeUndefined()
    // proposedFields are now coerced to the typed value.
    expect(out[0].proposedFields.age).toBe(42)
  })

  it('warns (not errors) on a non-numeric value for type: number', () => {
    const out = validateRecords(
      [rec('people', { name: 'Anna', age: 'forty-two' })],
      registry,
    )
    expect(out[0].validationIssues.some(i => i.fieldName === 'age' && i.severity === 'warning')).toBe(true)
  })
})

describe('validateRecords — type: email warning', () => {
  it('warns when an email value lacks an @', () => {
    const out = validateRecords(
      [rec('people', { name: 'Anna', email: 'not-an-email' })],
      registry,
    )
    const issue = out[0].validationIssues.find(i => i.fieldName === 'email')
    expect(issue?.severity).toBe('warning')
  })

  it('accepts a well-formed email', () => {
    const out = validateRecords(
      [rec('people', { name: 'Anna', email: 'anna@example.com' })],
      registry,
    )
    expect(out[0].validationIssues.find(i => i.fieldName === 'email')).toBeUndefined()
  })
})

describe('validateRecords — record-level', () => {
  it('reports a record-level error when no target section is chosen', () => {
    const out = validateRecords([rec(null, { name: 'Anna' })], registry)
    expect(out[0].validationIssues).toHaveLength(1)
    expect(out[0].validationIssues[0]).toMatchObject({
      fieldName: '__section',
      severity: 'error',
    })
  })

  it('reports a record-level error when the chosen section is unknown', () => {
    const out = validateRecords([rec('unknownSection', { name: 'Anna' })], registry)
    expect(out[0].validationIssues.some(i => i.fieldName === '__section')).toBe(true)
  })
})

describe('validateRecords — Companion Voice copy', () => {
  it('messages contain no exclamation marks', () => {
    const out = validateRecords(
      [rec('people', { ssn: 'not-an-ssn', age: 300, email: 'no-at-sign' })],
      registry,
    )
    for (const issue of out[0].validationIssues) {
      expect(issue.message).not.toContain('!')
    }
  })
})
