import { LocalDataStore } from '@/services/LocalDataStore'
import { schemaRegistry } from '@/schemas'
import { CURRENT_SCHEMA_VERSION } from '@/migrations'
import type { DeathboxData } from '@/models/DeathboxData'
import type { FormSectionSchema } from '@/models/FormSchema'
import type {
  ImportCommitResult,
  ImportedRecord,
  RecordCommitChoice,
} from './ImportSource'

/**
 * Per-record commit decision passed from the preview UI.
 *
 *   choice = 'add'    → push as new record
 *   choice = 'merge'  → shallow-merge proposedFields into existing record
 *                       identified by mergeTargetId; falls back to 'add'
 *                       when the target isn't found (defensive — user may
 *                       have refreshed and the target is gone)
 *   choice = 'skip'   → no write
 */
export interface CommitChoice {
  choice: RecordCommitChoice
  /** id of the existing record to merge into (required when choice === 'merge'). */
  mergeTargetId?: string
}

/**
 * Commit imported records to the live vault (Story 1.14a, AC5 + AC7).
 *
 * **All-or-nothing semantics**: the entire read-modify-write cycle runs
 * inside a single Dexie `rw` transaction via `LocalDataStore.updateAtomic`.
 * A throw anywhere in the in-memory mutation causes Dexie to roll the
 * IndexedDB transaction back — the live vault is exactly as it was. The
 * localStorage mirror is best-effort post-commit; IndexedDB is the source
 * of truth.
 *
 * Records with `proposedSection === null` are counted as skipped and
 * silently dropped (the preview UI should have prevented commit, but be
 * defensive at the boundary).
 *
 * Returns `{ added, merged, skipped, sectionsAffected }` for the summary
 * modal.
 */
export async function commitImport(
  records: ImportedRecord[],
  choices: CommitChoice[],
): Promise<ImportCommitResult> {
  if (records.length !== choices.length) {
    throw new Error(
      `commitImport: records (${records.length}) and choices (${choices.length}) length mismatch.`,
    )
  }

  const store = new LocalDataStore()
  let added = 0
  let merged = 0
  let skipped = 0
  const sectionsTouched = new Set<string>()

  await store.updateAtomic(current => {
    // Seed an empty vault at the current schema version if the user hasn't
    // saved anything yet. Using the literal `1` here would silently leave
    // the vault on a stale schema after a future migration bump.
    const next: DeathboxData =
      current ?? ({ schemaVersion: CURRENT_SCHEMA_VERSION } as DeathboxData)

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const choice = choices[i]

      if (choice.choice === 'skip' || record.proposedSection === null) {
        skipped++
        continue
      }

      const section = record.proposedSection
      const schema = schemaRegistry[section]
      let target = (next as Record<string, unknown>)[section]
      if (target === undefined || target === null) {
        target = schema?.isArray ? [] : {}
        ;(next as Record<string, unknown>)[section] = target
      }
      // Defensive: if existing data shape doesn't match the schema's
      // declared isArray, reinitialize. A vault that was wiped or
      // partially migrated may carry the wrong shape.
      if (schema?.isArray && !Array.isArray(target)) {
        target = []
        ;(next as Record<string, unknown>)[section] = target
      }

      const isArraySection = Array.isArray(target)

      if (isArraySection) {
        const arr = target as Array<Record<string, unknown>>
        if (choice.choice === 'merge' && choice.mergeTargetId !== undefined) {
          const idx = arr.findIndex(item => item.id === choice.mergeTargetId)
          if (idx >= 0) {
            arr[idx] = mergeAndAppendUnmapped(
              arr[idx],
              record.proposedFields,
              record.unmappedFields,
              schema,
            )
            merged++
            sectionsTouched.add(section)
            continue
          }
          // Fall through to add when the merge target isn't found.
        }
        arr.push(buildNewRecord(record.proposedFields, record.unmappedFields, schema))
        added++
      } else {
        // Non-array section — merge into the object (or set if missing).
        const existing = (target ?? {}) as Record<string, unknown>
        const wasMerge = choice.choice === 'merge' && Object.keys(existing).length > 0
        ;(next as Record<string, unknown>)[section] = mergeAndAppendUnmapped(
          existing,
          record.proposedFields,
          record.unmappedFields,
          schema,
        )
        if (wasMerge) {
          merged++
        } else {
          added++
        }
      }
      sectionsTouched.add(section)
    }

    return next
  })

  return {
    added,
    merged,
    skipped,
    sectionsAffected: Array.from(sectionsTouched).sort(),
  }
}

/**
 * Pick the notes-ish field name for the target schema.
 *
 * Schema is authoritative: if the schema declares a field named `notes` /
 * `note` / `importNotes`, prefer that. Otherwise default to `notes` (the
 * project-wide convention). This replaces the earlier sniff-the-existing-
 * record approach that could pick a field name the schema didn't declare.
 */
function pickNotesFieldFromSchema(schema: FormSectionSchema | undefined): string {
  if (schema) {
    for (const candidate of ['notes', 'note', 'importNotes'] as const) {
      if (schema.fields.some(f => f.name === candidate)) return candidate
    }
  }
  return 'notes'
}

function stringifyUnmapped(unmapped: Record<string, string>): string {
  return Object.entries(unmapped)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
}

/**
 * Generate a stable id for a new array-section record. Uses the schema's
 * `initializeItem()` if present (matches what hand-entered records look
 * like — see `people.schema.ts:initializeItem`); falls back to
 * `crypto.randomUUID()` otherwise. Without an id, the record can't be
 * targeted by later merges, can't be referenced from `optionsFrom`, and
 * can't be selected via BeneficiarySelector.
 */
function generateRecordId(schema: FormSectionSchema | undefined): string | null {
  if (schema?.initializeItem) {
    const seeded = schema.initializeItem() as Record<string, unknown>
    if (typeof seeded.id === 'string' && seeded.id.length > 0) return seeded.id
  }
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Last-resort id (test environments without crypto.randomUUID).
  return `imported-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Construct a fresh record from `proposedFields`. Generates a stable id
 * if the schema is an array section (so the record participates in
 * dedup, selectors, and optionsFrom lookups). Appends `unmappedFields`
 * to the schema's notes-ish field if any are present.
 */
function buildNewRecord(
  proposedFields: Record<string, unknown>,
  unmappedFields: Record<string, string>,
  schema: FormSectionSchema | undefined,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...proposedFields }

  if (schema?.isArray && typeof out.id !== 'string') {
    const id = generateRecordId(schema)
    if (id !== null) out.id = id
  }

  if (Object.keys(unmappedFields).length === 0) return out

  const notesField = pickNotesFieldFromSchema(schema)
  const existingNotes = (out[notesField] as string | undefined) ?? ''
  const appendix = stringifyUnmapped(unmappedFields)
  out[notesField] = existingNotes.length > 0 ? `${existingNotes}\n\n${appendix}` : appendix
  return out
}

/**
 * Merge `proposedFields` into `existing`, appending any `unmappedFields`
 * to the schema-declared notes-ish field. Non-notes fields shallow-
 * overwrite.
 */
function mergeAndAppendUnmapped(
  existing: Record<string, unknown>,
  proposedFields: Record<string, unknown>,
  unmappedFields: Record<string, string>,
  schema: FormSectionSchema | undefined,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...existing }
  const notesField = pickNotesFieldFromSchema(schema)

  // Shallow-merge proposed fields, EXCEPT the notes field — that gets
  // special concat treatment so prior notes survive.
  for (const [key, value] of Object.entries(proposedFields)) {
    if (key === 'notes' || key === 'note' || key === 'importNotes') continue
    merged[key] = value
  }

  // If proposedFields has a notes-ish value, concat it onto existing.
  const incomingNotesRaw =
    (proposedFields.notes as string | undefined) ??
    (proposedFields.note as string | undefined) ??
    (proposedFields.importNotes as string | undefined)
  if (typeof incomingNotesRaw === 'string' && incomingNotesRaw.length > 0) {
    const prior = typeof merged[notesField] === 'string' ? (merged[notesField] as string) : ''
    merged[notesField] = prior.length > 0 ? `${prior}\n\n${incomingNotesRaw}` : incomingNotesRaw
  }

  // Append unmapped fields after that.
  if (Object.keys(unmappedFields).length > 0) {
    const appendix = stringifyUnmapped(unmappedFields)
    const prior = typeof merged[notesField] === 'string' ? (merged[notesField] as string) : ''
    merged[notesField] = prior.length > 0 ? `${prior}\n\n${appendix}` : appendix
  }

  return merged
}
