import Dexie, { type Table } from 'dexie'
import type { DeathboxData } from '@/models/DeathboxData'
import type { AttachmentRecord } from '@/models/AttachmentRecord'
import type { IDataStore } from './IDataStore'
import { encrypt, decrypt, isEncrypted } from '@/utils/encryption'
import {
  AttachmentExportLimitError,
  LoadRequiresManualImportError,
  MigrationFailedError,
  StorageQuotaExceededError,
} from './errors'
import { useStorageQuota } from '@/composables/useStorageQuota'
import {
  CURRENT_SCHEMA_VERSION,
  runMigrations,
} from '@/migrations'
import { schemaRegistry } from '@/schemas'
import { AttachmentStore } from './AttachmentStore'

const MAX_ATTACHMENT_INLINE_SIZE = 25 * 1024 * 1024 // 25 MB per file
const MAX_TOTAL_INLINE_SIZE = 250 * 1024 * 1024 // 250 MB total

interface AttachmentEnvelopeEntry {
  metadata: {
    filename: string
    mimeType: string
    sizeBytes: number
    uploadedAt: string
  }
  /** Base64-encoded plaintext blob bytes. Outer-envelope encryption protects it. */
  base64: string
}

interface ExportEnvelope {
  envelopeVersion: 1
  exportedAt: string
  data: DeathboxData
  attachments: Record<string, AttachmentEnvelopeEntry>
}

/**
 * Detect quota-exceeded errors across browsers. Chrome/Edge/Safari throw
 * `DOMException` with `name === 'QuotaExceededError'`; Firefox can throw
 * the same OR `'NS_ERROR_DOM_QUOTA_REACHED'`. Anchored to specific error
 * NAMES (not loose substring matches on message text) so an unrelated
 * Error whose message happens to contain "quota" — e.g., a server
 * response, a user-typed field, a third-party library — cannot
 * false-positive into flipping the global quota state.
 */
function isQuotaError(err: unknown): boolean {
  if (!err) return false
  const name = (err as { name?: string }).name ?? ''
  return (
    name === 'QuotaExceededError' ||
    name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    // Older Safari surfaces a generic Error with this code.
    (err as { code?: number }).code === 22
  )
}

interface StoredData {
  id: string
  data: DeathboxData
}

/**
 * Pre-migration rollback row (Story 1.13). Keyed by
 * `rollback_v<n>_<context>` where:
 *   - n is the schemaVersion at the time of the snapshot
 *   - context is "load" (live data being upgraded on read) or "import"
 *     (incoming JSON being upgraded before persistence)
 *
 * Separate contexts prevent an import from clobbering a legitimate live
 * rollback row mid-flight (P1). The restore path is always read from the
 * same context that wrote.
 */
interface RollbackRow {
  key: string
  data: DeathboxData
  createdAt: string
}

type RollbackContext = 'load' | 'import'

function rollbackKey(fromVersion: number, context: RollbackContext): string {
  return `rollback_v${fromVersion}_${context}`
}

class LifeRelayDatabase extends Dexie {
  data!: Table<StoredData, string>
  rollback!: Table<RollbackRow, string>
  attachments!: Table<AttachmentRecord, string>

  constructor() {
    // Keep DB name for backward compatibility with existing user data
    super('LegacyVaultDB')
    this.version(1).stores({
      data: 'id',
    })
    // v2: add `rollback` table for the pre-migration snapshot (Story 1.13).
    // Dexie handles the additive upgrade automatically — existing v1
    // users gain the empty table on next open.
    this.version(2).stores({
      data: 'id',
      rollback: 'key',
    })
    // v3: add `attachments` table for binary file uploads (Story 1.7).
    // Additive — existing v2 users gain the empty table on next open.
    // Only `id` is indexed; the blob lives in the row body.
    this.version(3).stores({
      data: 'id',
      rollback: 'key',
      attachments: 'id',
    })
  }
}

const db = new LifeRelayDatabase()
const DATA_KEY = 'main'

/**
 * Module-level accessor for the attachments table. `AttachmentStore`
 * owns its own CRUD methods but shares this single Dexie database so
 * future transactional coordination (e.g., delete-vault clears both
 * tables atomically) is possible.
 */
export function _getAttachmentsTable(): Table<AttachmentRecord, string> {
  return db.attachments
}

export class LocalDataStore implements IDataStore {
  private readonly STORAGE_KEY = 'legacyVaultData'

  async load(): Promise<DeathboxData | null> {
    let raw: DeathboxData | null = null
    let indexedDbFailed = false
    try {
      const stored = await db.data.get(DATA_KEY)
      if (stored?.data) {
        // Ensure we return a plain object (not reactive)
        raw = JSON.parse(JSON.stringify(stored.data))
      }
    } catch (error) {
      indexedDbFailed = true
      console.error('Error loading data from IndexedDB:', error)
      // Fallback to localStorage ONLY when IndexedDB itself failed — never
      // when it merely returned no row (which is a legitimate "fresh
      // install" state, not a failure). Without this guard we'd shadow a
      // real empty-DB with stale localStorage data.
      try {
        const localData = localStorage.getItem(this.STORAGE_KEY)
        raw = localData ? (JSON.parse(localData) as DeathboxData) : null
      } catch (e) {
        console.error('Error loading from localStorage:', e)
        raw = null
      }
    }
    if (raw === null) return null
    const { data, applied } = await this.applyMigrations(raw, 'load')
    if (applied.length > 0) {
      // Persist the upgrade so the migration is idempotent on next load.
      // If THIS save fails — e.g., quota exhausted — route through
      // restoreOrFail so the user gets a coherent surface instead of a
      // silently-stranded in-memory upgrade that will re-run on every
      // load until it succeeds (P11).
      try {
        await this.save(data)
      } catch (saveErr) {
        console.error('Post-migration save failed — routing to rollback restore:', saveErr)
        const fromVersion = raw.schemaVersion ?? 1
        await this.restoreOrFail(fromVersion, 'load', saveErr)
        // restoreOrFail always throws.
      }
      // Migration succeeded + persisted — clean up the rollback row.
      // Best-effort; failure to clean up doesn't undo the successful upgrade.
      await this.clearRollback(raw.schemaVersion ?? 1, 'load').catch(err =>
        console.error('Rollback cleanup failed (non-fatal):', err),
      )
    }
    // If IndexedDB read succeeded with empty data AND we didn't fall back,
    // the load was a legitimate fresh state. No further action.
    void indexedDbFailed
    return data
  }

  /**
   * Run the schema-migration chain to upgrade `raw` to
   * `CURRENT_SCHEMA_VERSION`. Writes a pre-migration rollback row BEFORE
   * any migration runs, keyed by the supplied `context` so a `load`
   * rollback and an `import` rollback can coexist (P1). On migration
   * failure OR post-migration validation failure, restores from rollback
   * and throws `MigrationFailedError` (or `LoadRequiresManualImportError`
   * if no rollback exists). Story 1.13.
   */
  private async applyMigrations(
    raw: DeathboxData,
    context: RollbackContext,
  ): Promise<{
    data: DeathboxData
    applied: number[]
  }> {
    const fromVersion = raw.schemaVersion ?? 1
    if (fromVersion === CURRENT_SCHEMA_VERSION) {
      // No migration needed — skip the rollback write entirely.
      return { data: raw, applied: [] }
    }

    // Snapshot the input shape so post-migration validation can detect
    // silent array→object (or vice versa) type flips per AC4.
    const inputShape = this.rememberShape(raw)

    // Best-effort pre-migration rollback write. If this fails (e.g.,
    // quota exhausted at exactly this moment), we attempt the migration
    // anyway — but a subsequent failure will route to the manual-import
    // surface since no rollback is available.
    await this.writeRollback(raw, context).catch(err =>
      console.error('Rollback write failed (will degrade to manual-import on migration failure):', err),
    )

    let migrated: DeathboxData
    let applied: number[]
    try {
      const result = runMigrations(raw, CURRENT_SCHEMA_VERSION)
      migrated = result.data
      applied = result.appliedVersions
    } catch (err) {
      console.error('Schema migration threw — restoring from rollback:', err)
      await this.restoreOrFail(fromVersion, context, err)
      // restoreOrFail always throws; the throw above is for type narrowing.
      throw err
    }

    const validation = this.validatePostMigration(migrated, inputShape)
    if (!validation.ok) {
      console.error('Post-migration validation failed:', validation.reason)
      await this.restoreOrFail(fromVersion, context, new Error(validation.reason))
    }

    return { data: migrated, applied }
  }

  /**
   * Capture the shape of top-level section keys so post-migration
   * validation can detect silent array→object (or vice versa) flips.
   * Story 1.13 AC4.
   */
  private rememberShape(data: DeathboxData): Record<string, 'array' | 'object' | 'primitive'> {
    const shape: Record<string, 'array' | 'object' | 'primitive'> = {}
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) shape[key] = 'array'
      else if (value !== null && typeof value === 'object') shape[key] = 'object'
      else shape[key] = 'primitive'
    }
    return shape
  }

  /**
   * Lightweight post-migration validation. Catches gross failure modes
   * (wrong version, silent type flips on top-level sections); deep
   * field-level checks are the migration author's responsibility.
   */
  private validatePostMigration(
    data: DeathboxData,
    inputShape: Record<string, 'array' | 'object' | 'primitive'>,
  ): { ok: true } | { ok: false; reason: string } {
    if (data.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      return {
        ok: false,
        reason: `Post-migration schemaVersion is ${data.schemaVersion}, expected ${CURRENT_SCHEMA_VERSION}`,
      }
    }
    for (const [key, beforeShape] of Object.entries(inputShape)) {
      if (!(key in data)) continue // migration legitimately removed this section
      const afterValue = (data as Record<string, unknown>)[key]
      const afterShape = Array.isArray(afterValue)
        ? 'array'
        : afterValue !== null && typeof afterValue === 'object'
          ? 'object'
          : 'primitive'
      if (beforeShape !== afterShape) {
        return {
          ok: false,
          reason: `Section "${key}" shape changed from ${beforeShape} to ${afterShape} during migration`,
        }
      }
    }
    return { ok: true }
  }

  /**
   * Read the rollback row, persist it as the live data row, clear the
   * rollback row so a subsequent successful load doesn't see a stale
   * snapshot (P12), and throw `MigrationFailedError` so the caller can
   * surface a Companion Voice modal. If the rollback row is missing,
   * throw `LoadRequiresManualImportError` instead — the manual-import
   * surface is the only safe path.
   */
  private async restoreOrFail(
    fromVersion: number,
    context: RollbackContext,
    cause: unknown,
  ): Promise<never> {
    const rollback = await this.readRollback(fromVersion, context).catch(err => {
      console.error('Rollback read failed:', err)
      return null
    })
    if (rollback === null) {
      throw new LoadRequiresManualImportError(undefined, { cause })
    }
    try {
      await this.save(rollback)
    } catch (saveErr) {
      console.error('Restore-from-rollback save failed:', saveErr)
      throw new LoadRequiresManualImportError(undefined, { cause: saveErr })
    }
    // Best-effort cleanup — if this fails, the next load will see the
    // stale rollback but won't act on it (the live data is now valid at
    // its original version, so no migration runs).
    await this.clearRollback(fromVersion, context).catch(err =>
      console.error('Post-restore rollback cleanup failed (non-fatal):', err),
    )
    throw new MigrationFailedError(undefined, { cause })
  }

  private async writeRollback(data: DeathboxData, context: RollbackContext): Promise<void> {
    const key = rollbackKey(data.schemaVersion ?? 1, context)
    const serialized = JSON.parse(JSON.stringify(data))
    await db.rollback.put({
      key,
      data: serialized,
      createdAt: new Date().toISOString(),
    })
  }

  private async readRollback(
    fromVersion: number,
    context: RollbackContext,
  ): Promise<DeathboxData | null> {
    const key = rollbackKey(fromVersion, context)
    const row = await db.rollback.get(key)
    return row ? (JSON.parse(JSON.stringify(row.data)) as DeathboxData) : null
  }

  private async clearRollback(
    fromVersion: number,
    context: RollbackContext,
  ): Promise<void> {
    const key = rollbackKey(fromVersion, context)
    await db.rollback.delete(key)
  }

  /**
   * Atomic read-modify-write inside a single Dexie `rw` transaction over
   * the `data` table. Required by Story 1.14a AC7 (all-or-nothing import
   * commit). The `updater` callback receives the current `DeathboxData`
   * (or `null` for a fresh vault) and returns the new value to persist.
   *
   * Throws if the updater throws OR if the transaction fails. On failure,
   * IndexedDB is left untouched (Dexie auto-rolls back the transaction).
   *
   * localStorage mirroring happens AFTER the transaction commits — it is
   * intentionally non-transactional (localStorage has no transaction
   * primitive), but the IndexedDB write is the source of truth, so a
   * partial localStorage failure is recoverable on next load.
   */
  async updateAtomic(
    updater: (current: DeathboxData | null) => DeathboxData,
  ): Promise<DeathboxData> {
    let nextSerialized: any = null
    try {
      await db.transaction('rw', db.data, async () => {
        const stored = await db.data.get(DATA_KEY)
        const current = stored?.data ? (JSON.parse(JSON.stringify(stored.data)) as DeathboxData) : null
        const next = updater(current)
        nextSerialized = JSON.parse(JSON.stringify(next))
        const dataToSave = {
          ...nextSerialized,
          updatedAt: new Date().toISOString(),
        }
        await db.data.put({ id: DATA_KEY, data: dataToSave })
      })
    } catch (error) {
      console.error('updateAtomic transaction failed (IndexedDB rolled back):', error)
      if (isQuotaError(error)) {
        useStorageQuota().markFull()
        throw new StorageQuotaExceededError(undefined, { cause: error })
      }
      throw error
    }
    // Best-effort localStorage mirror after the IDB transaction succeeded.
    try {
      const dataToMirror = {
        ...nextSerialized,
        updatedAt: new Date().toISOString(),
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToMirror))
    } catch (error) {
      console.error('localStorage mirror failed after successful IDB write (non-fatal):', error)
    }
    return nextSerialized as DeathboxData
  }

  async save(data: DeathboxData): Promise<void> {
    try {
      // Serialize the data to remove Vue reactive proxies and ensure it's a plain object
      const serialized = JSON.parse(JSON.stringify(data))
      const dataToSave = {
        ...serialized,
        updatedAt: new Date().toISOString(),
      }

      // Save to IndexedDB
      await db.data.put({
        id: DATA_KEY,
        data: dataToSave,
      })

      // Also save to localStorage as backup
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave))
    } catch (error) {
      console.error('Error saving data:', error)
      if (isQuotaError(error)) {
        // Flip the global quota state so the hard-block modal surfaces
        // synchronously on this failed save (Story 1.8). The next async
        // refresh of `navigator.storage.estimate()` would catch up
        // eventually, but the user needs the modal NOW.
        useStorageQuota().markFull()
        throw new StorageQuotaExceededError(undefined, { cause: error })
      }
      throw error
    }
  }

  async delete(): Promise<void> {
    try {
      // Privacy promise: "Delete All Data" must wipe BOTH the vault data
      // row AND every attachment blob atomically. A swallowed
      // attachments-clear error would leave megabytes of sensitive
      // document scans on disk while the user believes everything is
      // gone (Story 1.7 review finding P2). Wrap both deletes in a
      // single Dexie `rw` transaction across both tables so either both
      // succeed or both roll back.
      await db.transaction('rw', db.data, db.attachments, async () => {
        await db.data.delete(DATA_KEY)
        await db.attachments.clear()
      })
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.error('Error deleting data:', error)
      throw error
    }
  }

  async exportToJSON(password?: string): Promise<string> {
    const data = await this.load()
    const envelope = await this.buildExportEnvelope(data)
    const jsonString = JSON.stringify(envelope, null, 2)

    if (password) {
      // Outer-envelope encryption: attachments live inside the envelope
      // as base64 plaintext bytes; the whole envelope (data + attachment
      // base64 strings + metadata) becomes one AES-GCM ciphertext.
      return await encrypt(jsonString, password)
    }

    return jsonString
  }

  /**
   * Build the export envelope (Story 1.7).
   *
   * Walks the vault for attachment-typed fields, loads each referenced
   * blob from `AttachmentStore`, enforces the inline size limits, and
   * base64-encodes each blob into the envelope. Throws
   * `AttachmentExportLimitError` if a single attachment > 25 MB or the
   * total > 250 MB — sidecar tar/zip is deferred to Story 1.7b.
   */
  private async buildExportEnvelope(data: DeathboxData | null): Promise<ExportEnvelope> {
    const attachmentsDict: Record<string, AttachmentEnvelopeEntry> = {}
    const referencedIds = data ? collectAttachmentIds(data) : []
    if (referencedIds.length > 0) {
      const store = new AttachmentStore()
      let totalBytes = 0
      for (const id of referencedIds) {
        const record = await store.get(id)
        if (!record) continue // orphan reference — skip silently
        if (record.sizeBytes > MAX_ATTACHMENT_INLINE_SIZE) {
          throw new AttachmentExportLimitError(
            `Attachment "${record.filename}" is ${humanSize(record.sizeBytes)}; the inline export limit is ${humanSize(MAX_ATTACHMENT_INLINE_SIZE)} per file. A larger-export format is coming in a follow-up.`,
          )
        }
        totalBytes += record.sizeBytes
        if (totalBytes > MAX_TOTAL_INLINE_SIZE) {
          throw new AttachmentExportLimitError(
            `Total attachment size exceeds the inline export limit of ${humanSize(MAX_TOTAL_INLINE_SIZE)}. A larger-export format is coming in a follow-up.`,
          )
        }
        attachmentsDict[id] = {
          metadata: {
            filename: record.filename,
            mimeType: record.mimeType,
            sizeBytes: record.sizeBytes,
            uploadedAt: record.uploadedAt,
          },
          base64: uint8ArrayToBase64(record.blob),
        }
      }
    }
    return {
      envelopeVersion: 1,
      exportedAt: new Date().toISOString(),
      data: data ?? ({ schemaVersion: CURRENT_SCHEMA_VERSION } as DeathboxData),
      attachments: attachmentsDict,
    }
  }

  async importFromJSON(jsonString: string, password?: string): Promise<void> {
    try {
      let decryptedString = jsonString

      // Check if data is encrypted and decrypt if needed
      if (password) {
        if (isEncrypted(jsonString)) {
          decryptedString = await decrypt(jsonString, password)
        }
      } else {
        // Check if it's encrypted but no password provided
        if (isEncrypted(jsonString)) {
          throw new Error('This file is encrypted. Please provide a password to decrypt it.')
        }
      }

      const parsed = JSON.parse(decryptedString)

      // Detect envelope vs raw-DeathboxData (back-compat for exports
      // made before Story 1.7 introduced the envelope wrapper).
      let data: DeathboxData
      let attachments: Record<string, AttachmentEnvelopeEntry> = {}
      if (
        parsed &&
        typeof parsed === 'object' &&
        typeof parsed.envelopeVersion === 'number' &&
        parsed.data &&
        typeof parsed.data === 'object'
      ) {
        // Strict envelope-version check: only v1 is supported by this
        // build. A future v2 envelope (e.g., sidecar tar+manifest) would
        // carry additional fields this code can't interpret — refuse
        // rather than silently degrade.
        if (parsed.envelopeVersion !== 1) {
          throw new Error(
            `This backup was made with a newer Life Relay format (envelope v${parsed.envelopeVersion}). Update the app before importing it.`,
          )
        }
        data = parsed.data as DeathboxData
        if (parsed.attachments && typeof parsed.attachments === 'object') {
          attachments = parsed.attachments as Record<string, AttachmentEnvelopeEntry>
        }
      } else {
        // Legacy export — just the DeathboxData payload at the root.
        data = parsed as DeathboxData
      }

      // Run any schema migrations needed before persisting. Uses the
      // 'import' rollback context so a load-time rollback in flight (if
      // any) is not clobbered — P1.
      const { data: migrated } = await this.applyMigrations(data, 'import')

      // Decode attachment blobs OUTSIDE the transaction (base64 decode
      // can throw; we want the failure to happen before the atomic
      // write begins).
      const decodedAttachments: AttachmentRecord[] = []
      if (Object.keys(attachments).length > 0) {
        for (const [id, entry] of Object.entries(attachments)) {
          if (!entry?.metadata || typeof entry.base64 !== 'string') continue
          let blob: Uint8Array
          try {
            blob = base64ToUint8Array(entry.base64)
          } catch (decodeErr) {
            const wrapped = new Error(
              `Import failed: attachment "${entry.metadata.filename}" has corrupted content in the backup file (couldn't decode base64).`,
            )
            ;(wrapped as { cause?: unknown }).cause = decodeErr
            throw wrapped
          }
          // Validate envelope-claimed `sizeBytes` against the actual
          // decoded blob length — a tampered or corrupted export could
          // claim 1 byte while shipping megabytes, breaking downstream
          // size budgeting (Story 1.7c review finding).
          const claimedSize = entry.metadata.sizeBytes
          const actualSize = blob.byteLength
          const trustedSize =
            typeof claimedSize === 'number' && claimedSize === actualSize
              ? claimedSize
              : actualSize
          decodedAttachments.push({
            id,
            filename: entry.metadata.filename,
            mimeType: entry.metadata.mimeType,
            sizeBytes: trustedSize,
            uploadedAt: entry.metadata.uploadedAt,
            blob,
          })
        }
      }

      // Atomic write: vault data + every attachment blob in one Dexie
      // transaction. Either all succeed or none persist — no dangling
      // references on partial failure (Story 1.7 review finding P1).
      // Pre-existing attachments are cleared inside the transaction so
      // a re-import doesn't accumulate orphan blobs from the prior
      // vault state (Story 1.7c review finding).
      const serialized = JSON.parse(JSON.stringify(migrated))
      // Preserve the envelope's `updatedAt` when present — overwriting
      // with `new Date()` would lose the timestamp of when the export
      // was originally created.
      const preservedUpdatedAt =
        typeof serialized.updatedAt === 'string' && serialized.updatedAt.length > 0
          ? serialized.updatedAt
          : new Date().toISOString()
      const dataToSave = { ...serialized, updatedAt: preservedUpdatedAt }
      try {
        await db.transaction('rw', db.data, db.attachments, async () => {
          await db.attachments.clear()
          await db.data.put({ id: DATA_KEY, data: dataToSave })
          for (const record of decodedAttachments) {
            await db.attachments.put(record)
          }
        })
      } catch (txError) {
        if (isQuotaError(txError)) {
          useStorageQuota().markFull()
          throw new StorageQuotaExceededError(undefined, { cause: txError })
        }
        throw txError
      }
      // Best-effort localStorage mirror after the IDB transaction
      // succeeded — matches `save()`'s post-IDB mirroring path.
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave))
      } catch (mirrorErr) {
        console.error('localStorage mirror after import failed (non-fatal):', mirrorErr)
      }
    } catch (error) {
      console.error('Error importing JSON:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Invalid JSON format or incorrect password')
    }
  }
}

/**
 * Read a section's value from `DeathboxData`, supporting dotted section
 * keys (e.g., `lifeInsurance.policies`). Some registry entries use dotted
 * keys to address nested data; a literal `data[key]` lookup misses them.
 */
function readSectionValue(data: DeathboxData, sectionKey: string): unknown {
  if (!sectionKey.includes('.')) {
    return (data as Record<string, unknown>)[sectionKey]
  }
  return sectionKey.split('.').reduce<unknown>(
    (acc, part) =>
      acc && typeof acc === 'object'
        ? (acc as Record<string, unknown>)[part]
        : undefined,
    data,
  )
}

/**
 * Walk `DeathboxData` collecting every attachment-typed field's value(s).
 * Uses the schema registry to know which sections/fields are attachment-
 * typed — no string heuristics, no UUID guessing.
 *
 * **Recursive** through `arraySchema` nested fields so a future schema
 * like `assetDocuments[i].scans: 'attachment'` doesn't silently skip
 * those ids on export (Story 1.7 review finding P4).
 */
function collectAttachmentIds(data: DeathboxData): string[] {
  const ids: string[] = []
  // Vault-level cover photo (Story 1.7c) — not part of any schema, so
  // the schema-walk below would miss it.
  if (typeof data.coverPhotoAttachmentId === 'string' && data.coverPhotoAttachmentId.length > 0) {
    ids.push(data.coverPhotoAttachmentId)
  }
  for (const [sectionKey, schema] of Object.entries(schemaRegistry)) {
    const sectionValue = readSectionValue(data, sectionKey)
    if (sectionValue === undefined || sectionValue === null) continue
    const items: unknown[] = schema.isArray
      ? Array.isArray(sectionValue)
        ? sectionValue
        : []
      : [sectionValue]
    for (const item of items) {
      collectIdsFromItem(item, schema.fields, ids)
    }
  }
  return ids
}

function collectIdsFromItem(
  item: unknown,
  fields: import('@/models/FormSchema').FormFieldSchema[],
  out: string[],
): void {
  if (!item || typeof item !== 'object') return
  const obj = item as Record<string, unknown>
  for (const field of fields) {
    if (!field.name) continue
    if (field.type === 'attachment') {
      const v = obj[field.name]
      if (Array.isArray(v)) {
        for (const id of v) {
          if (typeof id === 'string' && id.length > 0) out.push(id)
        }
      } else if (typeof v === 'string' && v.length > 0) {
        out.push(v)
      }
    } else if (field.type === 'array' && field.arraySchema) {
      // Recurse into nested array items — they may carry attachment
      // fields of their own.
      const nested = obj[field.name]
      if (Array.isArray(nested)) {
        for (const child of nested) {
          collectIdsFromItem(child, field.arraySchema.fields, out)
        }
      }
    }
  }
}

function humanSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`
}

/**
 * Convert a Uint8Array to a base64 string. Chunked at 8 KB (under the
 * older mobile Safari `apply()` arg-count safe ceiling) to avoid both
 * the stack-overflow trap on huge buffers AND the per-chunk `Array.from`
 * allocation the original implementation paid (Story 1.7 review finding
 * P3).
 *
 * `String.fromCharCode.apply(null, <typed array>)` works because typed
 * arrays are array-like (have `length` + numeric indices); no full-copy
 * `Array.from` is needed.
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x2000 // 8 KB — safely under every engine's apply() limit
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const slice = bytes.subarray(i, i + CHUNK)
    binary += String.fromCharCode.apply(null, slice as unknown as number[])
  }
  return btoa(binary)
}

function base64ToUint8Array(b64: string): Uint8Array {
  // `atob` throws `InvalidCharacterError` on malformed input. Caller
  // wraps in a more user-friendly message; we surface the raw throw
  // here so the import path can attribute it to a specific attachment.
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}
