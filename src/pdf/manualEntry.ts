/**
 * `manualEntry` cross-PDF contract (Story 1.11).
 *
 * When a schema field has `manualEntry: true` AND the user's data carries
 * `${fieldName}ManualEntry: true`, the PDF generators substitute the
 * stored value with a blank handwriting line so the survivor (or the
 * author themselves) can write the sensitive value by hand on the
 * printed page. The vault still records the value (encrypted at rest
 * via the export password); only the PRINT output suppresses it.
 *
 * All five PDF generators MUST reference this constant rather than
 * inlining an underscore literal — the contract test in
 * `src/pdf/__tests__/manualEntry.test.ts` enforces single-source-of-truth.
 */
export const MANUAL_ENTRY_BLANK_PLACEHOLDER = '____________________'
