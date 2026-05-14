import type { FormFieldSchema, FormSectionSchema } from '@/models/FormSchema'
import type { ImportValidationIssue, ImportedRecord } from './ImportSource'

/**
 * Schema-aware validation pass (Story 1.14a, AC6).
 *
 * For each record:
 *   - If `proposedSection` is null OR unknown → record-level error.
 *   - Otherwise, walk the chosen section's fields and check each:
 *       - `required` → error if value missing / empty
 *       - `validation.pattern` → error if non-empty value fails the regex
 *       - `validation.min` / `validation.max` → error if number out of range
 *       - `type: 'number'` → warn on non-numeric input; coerce numeric
 *         strings to numbers (and update proposedFields with the coerced
 *         value).
 *       - `type: 'email'` / `'date'` → WARNING (not error) on parse failure
 *         so the user can keep the raw value if they intended it.
 *
 * Returns new records with `validationIssues` and (for coerced numbers)
 * updated `proposedFields`. Input records are not mutated.
 *
 * Companion Voice copy: no exclamation marks, calm reassurance tone.
 */
export function validateRecords(
  records: ImportedRecord[],
  registry: Record<string, FormSectionSchema>,
): ImportedRecord[] {
  return records.map(r => validateOne(r, registry))
}

function validateOne(
  record: ImportedRecord,
  registry: Record<string, FormSectionSchema>,
): ImportedRecord {
  const issues: ImportValidationIssue[] = []
  const proposedFields: Record<string, unknown> = { ...record.proposedFields }

  if (record.proposedSection === null) {
    issues.push({
      fieldName: '__section',
      severity: 'error',
      message: 'Choose a target section before we can add this record.',
    })
    return { ...record, proposedFields, validationIssues: issues }
  }

  const schema = registry[record.proposedSection]
  if (!schema) {
    issues.push({
      fieldName: '__section',
      severity: 'error',
      message: `We don't know about a section named "${record.proposedSection}".`,
    })
    return { ...record, proposedFields, validationIssues: issues }
  }

  for (const field of schema.fields) {
    if (!field.name) continue
    const value = proposedFields[field.name]
    const issue = checkField(field, value, proposedFields)
    if (issue) issues.push(issue)
  }

  return { ...record, proposedFields, validationIssues: issues }
}

function checkField(
  field: FormFieldSchema,
  value: unknown,
  proposedFields: Record<string, unknown>,
): ImportValidationIssue | null {
  const isEmpty = value === undefined || value === null || (typeof value === 'string' && value.trim().length === 0)

  if (field.required && isEmpty) {
    return {
      fieldName: field.name!,
      severity: 'error',
      message: `We need a value for ${friendlyName(field)} before we can save this record.`,
    }
  }

  if (isEmpty) return null

  if (field.type === 'number') {
    const coerced = coerceNumber(value)
    if (coerced === null) {
      return {
        fieldName: field.name!,
        severity: 'warning',
        message: `${friendlyName(field)} doesn't look like a number. Want to keep it as written, or fix it?`,
      }
    }
    // Range-check BEFORE writing the coerced value back, so an out-of-
    // range value isn't silently coerced into proposedFields.
    if (field.validation?.min !== undefined && coerced < field.validation.min) {
      return {
        fieldName: field.name!,
        severity: 'error',
        message: `${friendlyName(field)} should be at least ${field.validation.min}.`,
      }
    }
    if (field.validation?.max !== undefined && coerced > field.validation.max) {
      return {
        fieldName: field.name!,
        severity: 'error',
        message: `${friendlyName(field)} should be no more than ${field.validation.max}.`,
      }
    }
    proposedFields[field.name!] = coerced
    return null
  }

  if (field.validation?.pattern) {
    const re = safeRegex(field.validation.pattern)
    if (re === null) {
      // Invalid regex in the schema — surface as a schema-level warning
      // so the bug is visible rather than failing open (silently
      // accepting any value).
      return {
        fieldName: '__schema',
        severity: 'warning',
        message: `The validation pattern for ${friendlyName(field)} couldn't be parsed; the value was accepted as written.`,
      }
    }
    const str = String(value)
    if (!re.test(str)) {
      return {
        fieldName: field.name!,
        severity: 'error',
        message: field.validation.message ?? `${friendlyName(field)} doesn't match the expected format.`,
      }
    }
  }

  if (field.type === 'email') {
    const str = String(value)
    if (!str.includes('@')) {
      return {
        fieldName: field.name!,
        severity: 'warning',
        message: `This looks like it should be an email address. Want to keep it as written, or fix it?`,
      }
    }
  }

  if (field.type === 'tel') {
    const str = String(value)
    // Soft check: at least 4 digits anywhere in the string. Phone formats
    // vary widely (international, extensions, parens, dashes), so we
    // only warn on input that has almost no digits at all.
    const digits = (str.match(/\d/g) ?? []).length
    if (digits < 4) {
      return {
        fieldName: field.name!,
        severity: 'warning',
        message: `${friendlyName(field)} doesn't look like a phone number. Want to keep it as written, or fix it?`,
      }
    }
  }

  if (field.type === 'date') {
    const str = String(value).trim()
    // Restrict to ISO YYYY-MM-DD (engine-agnostic, unambiguous). Other
    // formats may be valid in some locales but ambiguous (01/02/2026 is
    // Jan 2 in US, Feb 1 in EU). Warn on anything that isn't ISO.
    if (!/^\d{4}-\d{2}-\d{2}(T.+)?$/.test(str) || Number.isNaN(Date.parse(str))) {
      return {
        fieldName: field.name!,
        severity: 'warning',
        message: `${friendlyName(field)} should be in YYYY-MM-DD form. The raw value will be kept.`,
      }
    }
  }

  // Enum-shaped fields: incoming value must be in field.options. We treat
  // a non-matching value as a warning (not an error) so the user can keep
  // it as written and fix later — many imports come in with slight value
  // variants ("Primary Beneficiary" vs "primary").
  if ((field.type === 'select' || field.type === 'radio') && field.options) {
    const str = String(value).trim()
    if (str.length > 0) {
      const inOptions = field.options.some(o => String(o.value) === str || o.label === str)
      if (!inOptions) {
        return {
          fieldName: field.name!,
          severity: 'warning',
          message: `${friendlyName(field)} doesn't match a known option. Want to keep it as written, or pick one?`,
        }
      }
    }
  }

  return null
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length === 0) return null
    const n = Number(trimmed)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function safeRegex(pattern: string): RegExp | null {
  try {
    return new RegExp(pattern)
  } catch {
    return null
  }
}

function friendlyName(field: FormFieldSchema): string {
  return field.label ?? field.name ?? 'this field'
}
