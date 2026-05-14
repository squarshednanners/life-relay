import Fuse from 'fuse.js'
import type { FormFieldSchema, FormSectionSchema } from '@/models/FormSchema'
import type { ImportedRecord } from './ImportSource'

/**
 * Schema-aware auto-mapper (Story 1.14a, AC3).
 *
 * Pure function: given a list of parsed records + the schema registry,
 * pick a target section for each record and re-key its source fields onto
 * the schema's field names. Source fields that don't match any schema
 * field stay in `unmappedFields`.
 *
 * Algorithm:
 *
 *   For each record R:
 *     For each section S in registry:
 *       Match each source field in R.unmappedFields against S's fields
 *       using Fuse (fuzzy, threshold 0.3). Count CONFIDENT matches.
 *     Pick S* = argmax(confidentMatches). If score(S*) >= 2, assign R to
 *     S* and move matched source fields from unmappedFields to
 *     proposedFields keyed by schema field name. Else proposedSection
 *     stays null (user assigns manually in the preview UI).
 *
 * The "≥ 2 confident matches" threshold prevents single-field records
 * (e.g., paste-fallback "note") from being shoved into a random section.
 *
 * Determinism: Fuse with a fixed key list + stable record order gives
 * identical output across runs. Schema iteration uses `Object.keys`
 * which preserves insertion order in modern JS.
 */
export function autoMapRecords(
  records: ImportedRecord[],
  registry: Record<string, FormSectionSchema>,
): ImportedRecord[] {
  const sectionIndex = buildSectionIndex(registry)
  return records.map(r => mapOne(r, sectionIndex))
}

interface SectionIndexEntry {
  sectionKey: string
  /** Raw field-name entries for cheap exact/containment matching. */
  entries: FieldNameEntry[]
  /** Fuse instance preloaded with this section's field names — fuzzy fallback. */
  fuse: Fuse<FieldNameEntry>
}

interface FieldNameEntry {
  /** The canonical schema field name (e.g., 'phone'). */
  schemaFieldName: string
  /** Searchable name variants — schema field name, lowercase, camel→space, label-ish. */
  variants: string[]
}

function buildSectionIndex(
  registry: Record<string, FormSectionSchema>,
): SectionIndexEntry[] {
  return Object.keys(registry)
    .map(sectionKey => {
      const schema = registry[sectionKey]
      const entries: FieldNameEntry[] = schema.fields
        .filter((f): f is FormFieldSchema & { name: string } => typeof f.name === 'string')
        .map(f => ({
          schemaFieldName: f.name,
          variants: buildVariants(f.name),
        }))
      const fuse = new Fuse(entries, {
        keys: ['variants'],
        threshold: 0.3,
        includeScore: true,
        ignoreLocation: true,
        shouldSort: true,
      })
      return { sectionKey, entries, fuse }
    })
    // Skip sections with zero named fields — they can never score >= 2
    // and would still pollute tie-break ordering against legitimate
    // candidates. (Some schemas use only `sectionDivider` entries
    // without `name` for visual grouping.)
    .filter(s => s.entries.length > 0)
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Build searchable variants of a schema field name. Helps Fuse match
 * source columns that differ in casing or spacing:
 *
 *   'phone' → ['phone']
 *   'accountNumber' → ['accountNumber', 'account number', 'account_number', 'accountnumber']
 *   'emailAddress' → ['emailAddress', 'email address', 'email_address', 'emailaddress']
 */
function buildVariants(name: string): string[] {
  const lower = name.toLowerCase()
  const spaced = name.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
  const snake = spaced.replace(/\s+/g, '_')
  const concat = lower
  const set = new Set([name, lower, spaced, snake, concat])
  return Array.from(set)
}

function mapOne(record: ImportedRecord, sectionIndex: SectionIndexEntry[]): ImportedRecord {
  const sourceFields = Object.keys(record.unmappedFields)
  if (sourceFields.length === 0) {
    return { ...record, unmappedFields: { ...record.unmappedFields } }
  }

  // For each section, compute the best per-source-field match and count
  // those with a confident score (Fuse: lower is better).
  type SectionScore = {
    sectionKey: string
    matches: Map<string, string> // sourceField → schemaFieldName
  }
  const scores: SectionScore[] = sectionIndex.map(({ sectionKey, fuse, entries }) => {
    const matches = new Map<string, string>()
    for (const sourceField of sourceFields) {
      const sourceNorm = normalize(sourceField)
      // Exact / containment matching first (cheap). Containment requires
      // the matched variant be at least 4 chars OR exactly equal the
      // source — otherwise short schema fields like `id` / `pin` /
      // `name` would over-match "kidsname", "shipping", "username".
      const direct = entries.find(e =>
        e.variants.some(v => {
          const vNorm = normalize(v)
          if (vNorm.length === 0 || sourceNorm.length === 0) return false
          if (vNorm === sourceNorm) return true
          if (vNorm.length < 4) return false
          return sourceNorm.includes(vNorm) || vNorm.includes(sourceNorm)
        }),
      )
      if (direct) {
        matches.set(sourceField, direct.schemaFieldName)
        continue
      }
      // Fall back to Fuse for fuzzy match (catches typos like "Pone").
      const candidates = fuse.search(sourceField, { limit: 1 })
      if (candidates.length === 0) continue
      const top = candidates[0]
      if (top.score !== undefined && top.score <= 0.3) {
        matches.set(sourceField, top.item.schemaFieldName)
      }
    }
    return { sectionKey, matches }
  })

  // Pick the section with the most matches. Ties broken by registry order
  // (first wins) for determinism.
  let best: SectionScore | null = null
  for (const s of scores) {
    if (best === null || s.matches.size > best.matches.size) {
      best = s
    }
  }

  // Threshold: need ≥ 2 confident matches to claim a section.
  if (best === null || best.matches.size < 2) {
    return {
      ...record,
      proposedSection: null,
      proposedFields: {},
      unmappedFields: { ...record.unmappedFields },
    }
  }

  // Move matched source fields onto proposedFields; rest stay unmapped.
  // When two source columns both map to the SAME schema field (e.g.,
  // both "email" and "Email Address"), keep the first as the winner and
  // push the loser back into unmappedFields so the user sees it in the
  // preview rather than having it silently swallowed.
  const proposedFields: Record<string, unknown> = {}
  const unmappedFields: Record<string, string> = {}
  const claimedSchemaFields = new Set<string>()
  for (const [sourceField, value] of Object.entries(record.unmappedFields)) {
    const schemaField = best.matches.get(sourceField)
    if (schemaField !== undefined && !claimedSchemaFields.has(schemaField)) {
      proposedFields[schemaField] = value
      claimedSchemaFields.add(schemaField)
    } else {
      unmappedFields[sourceField] = value
    }
  }

  return {
    ...record,
    proposedSection: best.sectionKey,
    proposedFields,
    unmappedFields,
  }
}
