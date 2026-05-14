/**
 * Domain-specific service errors.
 *
 * These wrap underlying browser / database errors so callers can `instanceof`
 * check for known failure modes without parsing error messages or names.
 */

/**
 * Thrown by `LocalDataStore.save()` when IndexedDB rejects the write due to
 * exhausted storage quota. The caller can `instanceof` this to surface a
 * specific hard-block UI (Story 1.8) rather than a generic save failure.
 */
export class StorageQuotaExceededError extends Error {
  override readonly name = 'StorageQuotaExceededError'
  /** The underlying browser exception that triggered the quota error. */
  readonly cause?: unknown
  constructor(message?: string, options?: { cause?: unknown }) {
    super(message ?? 'Browser storage quota exceeded')
    if (options?.cause !== undefined) this.cause = options.cause
  }
}

/**
 * Thrown by `LocalDataStore.load()` / `importFromJSON()` when the migration
 * framework (Story 1.12) fails to upgrade a vault to the current
 * schemaVersion. The cause carries the underlying migration error so the
 * caller can surface a Companion Voice "your vault couldn't be upgraded"
 * modal (Story 1.13 owns the modal + automatic rollback).
 */
export class MigrationFailedError extends Error {
  override readonly name = 'MigrationFailedError'
  readonly cause?: unknown
  constructor(message?: string, options?: { cause?: unknown }) {
    super(message ?? 'Schema migration failed')
    if (options?.cause !== undefined) this.cause = options.cause
  }
}

/**
 * Thrown when both the migration AND the rollback row are missing/broken
 * (Story 1.13). The caller must surface a manual-import surface — the
 * data on this device cannot be safely opened.
 */
export class LoadRequiresManualImportError extends Error {
  override readonly name = 'LoadRequiresManualImportError'
  readonly cause?: unknown
  constructor(message?: string, options?: { cause?: unknown }) {
    super(message ?? 'Vault cannot be loaded — manual import required')
    if (options?.cause !== undefined) this.cause = options.cause
  }
}

/**
 * Thrown by `LocalDataStore.exportToJSON()` when the vault's attachments
 * exceed the inline-export limits (Story 1.7, architecture D-1 Refinement
 * 1): 25 MB per attachment or 250 MB total. The caller surfaces a
 * Companion Voice message that names the offending file(s) or total size
 * and points the user at the future tar/zip export (1.7b).
 */
export class AttachmentExportLimitError extends Error {
  override readonly name = 'AttachmentExportLimitError'
  readonly cause?: unknown
  constructor(message?: string, options?: { cause?: unknown }) {
    super(message ?? 'Attachments exceed the inline export size limits')
    if (options?.cause !== undefined) this.cause = options.cause
  }
}
