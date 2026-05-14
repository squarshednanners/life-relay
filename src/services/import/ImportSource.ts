/**
 * Structured-data import framework (Story 1.14a).
 *
 * Pluggable interface for source-specific parsers. CSV + paste land first;
 * Bitwarden JSON (1.14b) and 1Password .1pux (1.14c) are deferred but bolt
 * on top of this same `ImportSource` contract without re-touching the
 * auto-mapper, validator, dedup detector, or commit engine.
 *
 * The pipeline is:
 *
 *   raw input (File | string)
 *     → ImportSource.parse → ImportedRecord[]  (unmappedFields populated)
 *     → autoMap            → ImportedRecord[]  (proposedSection + proposedFields filled in)
 *     → validate           → ImportedRecord[]  (validationIssues populated)
 *     → preview UI
 *     → commit             → Dexie transaction (all-or-nothing)
 *
 * Each adapter is responsible ONLY for the first step: take raw input and
 * produce an array of records with `unmappedFields` populated. Everything
 * downstream is shared logic.
 */

/**
 * Identifier for a built-in import source. Add new variants here when
 * shipping a new adapter (1.14b: 'bitwarden', 1.14c: '1pux').
 */
export type ImportSourceId = 'csv' | 'paste'

export interface ImportSource {
  /** Stable identifier — used as a discriminator in views + tests. */
  id: ImportSourceId
  /** Human-readable label for the source picker UI. Companion Voice. */
  label: string
  /**
   * Parse raw input into a record stream. The adapter is responsible for
   * input shape (File vs string), encoding, and any source-specific quirks
   * (header rows, delimiters, heuristics). Output records have
   * `unmappedFields` populated; auto-mapping happens in the next pipeline
   * step.
   */
  parse(input: File | string): Promise<ImportedRecord[]>
}

/**
 * A single record produced by an import source. Mutates as it moves
 * through the pipeline: `unmappedFields` shrinks as fields are auto-mapped,
 * `proposedSection` / `proposedFields` fill in, then `validationIssues`
 * populates at the validate step.
 */
export interface ImportedRecord {
  /**
   * Human-readable origin label shown in the preview UI. Adapters set this
   * (e.g., "Row 4: Gmail" for CSV; "Block 2" for paste). Stable across
   * pipeline steps — never modified after `parse`.
   */
  sourceLabel: string
  /**
   * Schema sectionKey this record will be committed to. `null` when the
   * auto-mapper couldn't pick one with enough confidence — the user
   * assigns manually in the preview UI.
   */
  proposedSection: string | null
  /**
   * Field values keyed by schema field NAME (not source column name).
   * Populated by the auto-mapper from `unmappedFields`.
   */
  proposedFields: Record<string, unknown>
  /**
   * Source fields that the auto-mapper couldn't place into the chosen
   * section. Per AC5: at commit time these are stringified `key: value`
   * lines and appended to the target record's `notes` (or `note` /
   * `importNotes`) field — not a global Notes bucket.
   */
  unmappedFields: Record<string, string>
  /**
   * Issues populated at the validation step. Records with at least one
   * `severity: 'error'` cannot commit until the user fixes the value
   * inline or skips the row.
   */
  validationIssues: ImportValidationIssue[]
}

export interface ImportValidationIssue {
  /**
   * Schema field name the issue applies to, OR the literal string
   * `'__section'` for record-level issues (e.g., "no target section
   * chosen").
   */
  fieldName: string
  severity: 'error' | 'warning'
  /** Companion Voice user-facing message. No exclamation marks. */
  message: string
}

/**
 * User's per-record decision in the preview UI:
 *   - 'add'    — push as a new record onto the target array section
 *   - 'merge'  — shallow-merge into an existing record (chosen via dedup)
 *   - 'skip'   — don't commit this record
 *
 * Default in the UI is 'add'; the dedup pass surfaces a merge candidate
 * but doesn't auto-select it.
 */
export type RecordCommitChoice = 'add' | 'merge' | 'skip'

/**
 * Result of a successful commit. Returned to the summary modal so the
 * Companion Voice copy can render specific counts ("Added 42 items
 * across 8 sections. 5 items went to Notes for your review.").
 */
export interface ImportCommitResult {
  added: number
  merged: number
  skipped: number
  /** sectionKey list, deduplicated + sorted, that received writes. */
  sectionsAffected: string[]
}
