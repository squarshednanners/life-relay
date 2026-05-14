import type { DeathboxData } from '@/models/DeathboxData'
import type { ImportedRecord } from './ImportSource'

/**
 * Existing-record detection (Story 1.14a, AC4 merge prompt).
 *
 * For each record whose `proposedSection` points to an array section,
 * compare its dedup-key field (name / label / title / institution /
 * provider, whichever exists) against existing records in the same
 * section. Multiple matches OK — the preview surfaces all of them.
 *
 * Returns `Map<recordIndex, existingRecordRef[]>`. Records with no match
 * are simply absent from the map.
 *
 * Comparison is case-insensitive + trimmed. We don't try email / phone
 * matching: those are commonly shared across people (family email
 * accounts, work numbers) and would false-positive too often. Name-ish
 * fields are the safe signal.
 */

const DEDUP_KEYS = ['name', 'label', 'title', 'institution', 'provider'] as const

export function detectDuplicates(
  records: ImportedRecord[],
  existing: DeathboxData,
): Map<number, unknown[]> {
  const map = new Map<number, unknown[]>()
  records.forEach((record, index) => {
    if (record.proposedSection === null) return
    const existingArray = (existing as Record<string, unknown>)[record.proposedSection]
    if (!Array.isArray(existingArray)) return
    const incomingKey = extractDedupValue(record.proposedFields)
    if (incomingKey === null) return
    const matches = existingArray.filter(item => {
      const itemKey = extractDedupValue(item as Record<string, unknown>)
      if (itemKey === null) return false
      return itemKey === incomingKey
    })
    if (matches.length > 0) map.set(index, matches)
  })
  return map
}

function extractDedupValue(obj: Record<string, unknown>): string | null {
  for (const key of DEDUP_KEYS) {
    const value = obj[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      // NFKC normalization collapses visually-equivalent forms ("café"
      // composed vs decomposed, full-width vs half-width digits, weird
      // Notes-app whitespace) so the dedup pass doesn't miss obvious
      // matches because of invisible codepoint differences.
      return value
        .normalize('NFKC')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
    }
  }
  return null
}
