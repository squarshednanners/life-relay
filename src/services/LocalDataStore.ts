import Dexie, { type Table } from 'dexie'
import type { DeathboxData } from '@/models/DeathboxData'
import type { IDataStore } from './IDataStore'
import { encrypt, decrypt, isEncrypted } from '@/utils/encryption'
import {
  LoadRequiresManualImportError,
  MigrationFailedError,
  StorageQuotaExceededError,
} from './errors'
import { useStorageQuota } from '@/composables/useStorageQuota'
import {
  CURRENT_SCHEMA_VERSION,
  runMigrations,
} from '@/migrations'

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
  }
}

const db = new LifeRelayDatabase()
const DATA_KEY = 'main'

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
      await db.data.delete(DATA_KEY)
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.error('Error deleting data:', error)
      throw error
    }
  }

  async exportToJSON(password?: string): Promise<string> {
    const data = await this.load()
    const jsonString = JSON.stringify(data, null, 2)

    if (password) {
      // Encrypt the JSON before returning
      return await encrypt(jsonString, password)
    }

    return jsonString
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

      const data = JSON.parse(decryptedString) as DeathboxData
      // Run any schema migrations needed before persisting. Uses the
      // 'import' rollback context so a load-time rollback in flight (if
      // any) is not clobbered — P1.
      const { data: migrated } = await this.applyMigrations(data, 'import')
      await this.save(migrated)
    } catch (error) {
      console.error('Error importing JSON:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Invalid JSON format or incorrect password')
    }
  }
}
