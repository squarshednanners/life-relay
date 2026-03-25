import type { FormSectionSchema, FormFieldSchema } from '@/models/FormSchema'
import { evaluateVisibility } from '@/models/FormSchema'

export interface CompletenessResult {
  filled: number
  total: number
  percentage: number
}

/**
 * Count meaningful fields (skip section dividers, custom components like selectors)
 */
function isCountableField(field: FormFieldSchema): boolean {
  if (field.sectionDivider) return false
  if (!field.name) return false
  // Skip manual entry toggle fields (they're helper booleans, not user data)
  if (field.name.endsWith('ManualEntry')) return false
  return true
}

function hasValue(value: any): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'boolean') return true // booleans are always "filled"
  if (typeof value === 'number') return true
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') {
    return Object.values(value).some(v => hasValue(v))
  }
  return true
}

/**
 * Compute completeness for a single data object against a schema's fields
 */
function computeObjectCompleteness(fields: FormFieldSchema[], data: any): CompletenessResult {
  let filled = 0
  let total = 0

  for (const field of fields) {
    if (!isCountableField(field)) continue
    // Skip fields hidden by visibility conditions
    if (field.visible && !evaluateVisibility(field.visible, data)) continue

    total++
    if (hasValue(data?.[field.name!])) {
      filled++
    }
  }

  return {
    filled,
    total,
    percentage: total > 0 ? Math.round((filled / total) * 100) : 0,
  }
}

/**
 * Compute completeness for a schema section given its data
 */
export function computeCompleteness(
  schema: FormSectionSchema,
  data: any
): CompletenessResult {
  if (schema.isArray) {
    if (!Array.isArray(data) || data.length === 0) {
      return { filled: 0, total: 0, percentage: 0 }
    }
    // Aggregate across all items
    let totalFilled = 0
    let totalFields = 0
    for (const item of data) {
      const result = computeObjectCompleteness(schema.fields, item)
      totalFilled += result.filled
      totalFields += result.total
    }
    return {
      filled: totalFilled,
      total: totalFields,
      percentage: totalFields > 0 ? Math.round((totalFilled / totalFields) * 100) : 0,
    }
  } else {
    if (!data) {
      return { filled: 0, total: 0, percentage: 0 }
    }
    return computeObjectCompleteness(schema.fields, data)
  }
}
