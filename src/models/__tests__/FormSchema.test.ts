import { describe, it, expect } from 'vitest'
import { evaluateVisibility, getVisibleFields } from '../FormSchema'
import type { FormFieldSchema, VisibilityCondition } from '../FormSchema'

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
