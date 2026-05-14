/**
 * Attachment metadata + binary blob (Story 1.7).
 *
 * Stored in a separate Dexie table from the structured vault data so:
 *   - Vault data stays cheap to deep-clone via `JSON.parse(JSON.stringify(...))`
 *     (per project-context.md). Binary content uses a different path.
 *   - Reading attachment metadata for a form view doesn't pull megabytes
 *     of blob data into memory — `getMeta()` returns records without the
 *     `blob` field.
 *   - The vault remains a plain-JSON object even when attachments are
 *     present; schema fields hold `attachmentId` references (strings).
 */

export interface AttachmentRecord {
  /** UUID generated at upload time; the value stored in the schema field. */
  id: string
  /** Original filename as the user uploaded it. Not sanitized — display-only. */
  filename: string
  /** MIME type per the File API at upload time. */
  mimeType: string
  /** Authoritative size of the stored blob in bytes. */
  sizeBytes: number
  /** ISO8601 timestamp of upload (immutable; NOT `updatedAt`). */
  uploadedAt: string
  /**
   * Raw bytes. Dexie persists `Uint8Array` natively (structured-clone
   * algorithm). Must NEVER be routed through `JSON.parse(JSON.stringify())`
   * — that would coerce it to `{}` and silently lose all data.
   */
  blob: Uint8Array
}

/**
 * Metadata-only view of an `AttachmentRecord`. Returned by
 * `AttachmentStore.getMeta()` for list rendering where the full blob is
 * unnecessary.
 */
export type AttachmentMetadata = Omit<AttachmentRecord, 'blob'>
