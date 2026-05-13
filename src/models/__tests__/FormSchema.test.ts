import { describe, it, expect, vi } from 'vitest'
import { evaluateVisibility, getVisibleFields, resolveFieldDisplayAs } from '../FormSchema'
import type { FieldType, FormFieldSchema, VisibilityCondition } from '../FormSchema'

describe('evaluateVisibility', () => {
  it('returns true when no condition is provided', () => {
    expect(evaluateVisibility(undefined, {})).toBe(true)
  })

  it('equals operator matches value', () => {
    const condition: VisibilityCondition = { field: 'storageType', operator: 'equals', value: 'exchange' }
    expect(evaluateVisibility(condition, { storageType: 'exchange' })).toBe(true)
    expect(evaluateVisibility(condition, { storageType: 'single-sig' })).toBe(false)
  })

  it('notEquals operator matches non-equal value', () => {
    const condition: VisibilityCondition = { field: 'type', operator: 'notEquals', value: 'Other' }
    expect(evaluateVisibility(condition, { type: 'Bitcoin' })).toBe(true)
    expect(evaluateVisibility(condition, { type: 'Other' })).toBe(false)
  })

  it('contains operator checks substring', () => {
    const condition: VisibilityCondition = { field: 'name', operator: 'contains', value: 'test' }
    expect(evaluateVisibility(condition, { name: 'a test value' })).toBe(true)
    expect(evaluateVisibility(condition, { name: 'no match' })).toBe(false)
  })

  it('isEmpty operator checks empty values', () => {
    const condition: VisibilityCondition = { field: 'value', operator: 'isEmpty' }
    expect(evaluateVisibility(condition, { value: undefined })).toBe(true)
    expect(evaluateVisibility(condition, { value: null })).toBe(true)
    expect(evaluateVisibility(condition, { value: '' })).toBe(true)
    expect(evaluateVisibility(condition, { value: [] })).toBe(true)
    expect(evaluateVisibility(condition, { value: 'hello' })).toBe(false)
  })

  it('isNotEmpty operator checks non-empty values', () => {
    const condition: VisibilityCondition = { field: 'value', operator: 'isNotEmpty' }
    expect(evaluateVisibility(condition, { value: 'hello' })).toBe(true)
    expect(evaluateVisibility(condition, { value: [1] })).toBe(true)
    expect(evaluateVisibility(condition, { value: '' })).toBe(false)
    expect(evaluateVisibility(condition, { value: null })).toBe(false)
    expect(evaluateVisibility(condition, {})).toBe(false)
  })

  it('resolves nested paths', () => {
    const condition: VisibilityCondition = {
      field: 'multiSigConfig.requiredSignatures',
      operator: 'equals',
      value: 2,
    }
    expect(evaluateVisibility(condition, { multiSigConfig: { requiredSignatures: 2 } })).toBe(true)
    expect(evaluateVisibility(condition, { multiSigConfig: { requiredSignatures: 3 } })).toBe(false)
  })

  it('handles null intermediate in nested path gracefully', () => {
    const condition: VisibilityCondition = { field: 'a.b.c', operator: 'isEmpty' }
    expect(evaluateVisibility(condition, { a: null })).toBe(true)
    expect(evaluateVisibility(condition, {})).toBe(true)
  })

  it('evaluates AND compound conditions', () => {
    const condition: VisibilityCondition = {
      field: 'storageType',
      operator: 'equals',
      value: 'single-sig',
      and: [{ field: 'isCustodial', operator: 'equals', value: false }],
    }
    expect(evaluateVisibility(condition, { storageType: 'single-sig', isCustodial: false })).toBe(true)
    expect(evaluateVisibility(condition, { storageType: 'single-sig', isCustodial: true })).toBe(false)
    expect(evaluateVisibility(condition, { storageType: 'exchange', isCustodial: false })).toBe(false)
  })

  it('evaluates array of top-level conditions with AND semantics', () => {
    const conditions: VisibilityCondition[] = [
      { field: 'type', operator: 'equals', value: 'Bitcoin' },
      { field: 'storageType', operator: 'isNotEmpty' },
    ]
    expect(evaluateVisibility(conditions, { type: 'Bitcoin', storageType: 'exchange' })).toBe(true)
    expect(evaluateVisibility(conditions, { type: 'Bitcoin', storageType: '' })).toBe(false)
    expect(evaluateVisibility(conditions, { type: 'Ethereum', storageType: 'exchange' })).toBe(false)
  })
})

describe('getVisibleFields', () => {
  it('filters out invisible fields', () => {
    const fields: FormFieldSchema[] = [
      { name: 'always', label: 'Always', type: 'text' },
      {
        name: 'conditional',
        label: 'Conditional',
        type: 'text',
        visible: { field: 'showIt', operator: 'equals', value: true },
      },
    ]
    const result = getVisibleFields(fields, { showIt: false })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('always')
  })

  it('includes fields when condition is met', () => {
    const fields: FormFieldSchema[] = [
      {
        name: 'conditional',
        label: 'Conditional',
        type: 'text',
        visible: { field: 'showIt', operator: 'equals', value: true },
      },
    ]
    const result = getVisibleFields(fields, { showIt: true })
    expect(result).toHaveLength(1)
  })

  it('always includes section dividers without visibility conditions', () => {
    const fields: FormFieldSchema[] = [
      { sectionDivider: { label: 'Section' } },
      {
        name: 'hidden',
        label: 'Hidden',
        type: 'text',
        visible: { field: 'x', operator: 'equals', value: 'nope' },
      },
    ]
    const result = getVisibleFields(fields, {})
    expect(result).toHaveLength(1)
    expect(result[0].sectionDivider).toBeDefined()
  })
})

describe('resolveFieldDisplayAs', () => {
  it('schema override wins for prose', () => {
    const field: FormFieldSchema = { name: 'x', type: 'password', displayAs: 'prose' }
    expect(resolveFieldDisplayAs(field)).toBe('prose')
  })

  it('schema override wins for mono on a text field', () => {
    const field: FormFieldSchema = { name: 'x', type: 'text', displayAs: 'mono' }
    expect(resolveFieldDisplayAs(field)).toBe('mono')
  })

  it('defaults password to mono', () => {
    expect(resolveFieldDisplayAs({ name: 'p', type: 'password' })).toBe('mono')
  })

  it('defaults tel to prose (phone numbers read fine in proportional font)', () => {
    expect(resolveFieldDisplayAs({ name: 'p', type: 'tel' })).toBe('prose')
  })

  it('defaults prose-style types to prose', () => {
    const proseTypes: FieldType[] = [
      'text',
      'textarea',
      'number',
      'email',
      'tel',
      'date',
      'select',
      'checkbox',
      'radio',
      'currency',
      'array',
      'custom',
    ]
    for (const type of proseTypes) {
      expect(resolveFieldDisplayAs({ name: 'f', type })).toBe('prose')
    }
  })

  it('defaults to prose when type is undefined (section dividers)', () => {
    expect(resolveFieldDisplayAs({})).toBe('prose')
  })

  it('normalizes unexpected displayAs values to prose (with warning)', () => {
    // TypeScript's union narrows `displayAs` to 'prose' | 'mono' at compile
    // time, but raw JSON imports / dynamic schema authoring can slip a bad
    // value through. The resolver normalizes + warns.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const field = { name: 'x', type: 'text', displayAs: 'bogus' } as unknown as FormFieldSchema
      expect(resolveFieldDisplayAs(field)).toBe('prose')
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('unexpected displayAs="bogus"'),
      )
    } finally {
      warnSpy.mockRestore()
    }
  })
})
