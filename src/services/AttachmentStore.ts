import { _getAttachmentsTable } from './LocalDataStore'
import type {
  AttachmentMetadata,
  AttachmentRecord,
} from '@/models/AttachmentRecord'

/**
 * Binary attachment store (Story 1.7).
 *
 * CRUD over the `attachments` Dexie table. Owns ONLY metadata + raw bytes;
 * the field references (`attachmentId` strings) live inside `DeathboxData`
 * and are managed by the usual store + DynamicForm flow.
 *
 * **Reactivity boundary:** never accept Vue-reactive proxies. The `File`
 * coming in from `AttachmentField.vue` is held as a non-reactive value
 * before `add()` is called; the resulting `Uint8Array` is a fresh
 * buffer derived from `file.arrayBuffer()` — already non-reactive.
 *
 * **Persistence boundary:** never route blobs through
 * `JSON.parse(JSON.stringify(...))` — that coerces `Uint8Array` to `{}`
 * and silently destroys the file. Dexie persists `Uint8Array` natively
 * via the structured-clone algorithm; pass it through unchanged.
 */
export class AttachmentStore {
  private get table() {
    return _getAttachmentsTable()
  }

  /**
   * Add a new file. Reads the File into a fresh `Uint8Array`, generates
   * a UUID, persists, and returns the record metadata (without the blob
   * to avoid keeping a megabyte-sized object alive in the caller).
   *
   * @throws Error if `maxSizeBytes` is provided and the file exceeds it.
   *         Caller is responsible for surfacing this in the UI as a
   *         Companion Voice message.
   */
  async add(file: File, maxSizeBytes?: number): Promise<AttachmentMetadata> {
    if (maxSizeBytes !== undefined && file.size > maxSizeBytes) {
      throw new Error(
        `File "${file.name}" is ${file.size} bytes, which exceeds the ${maxSizeBytes}-byte limit.`,
      )
    }
    const arrayBuffer = await readFileBytes(file)
    // `new Uint8Array(arrayBuffer)` is a view over the entire buffer
    // (length === buffer.byteLength). `Uint8Array.from(...)` would copy
    // unnecessarily; the view is fine because Dexie's structured-clone
    // serializes the underlying buffer.
    const blob = new Uint8Array(arrayBuffer)
    const id = generateId()
    const record: AttachmentRecord = {
      id,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: blob.byteLength,
      uploadedAt: new Date().toISOString(),
      blob,
    }
    await this.table.put(record)
    return toMetadata(record)
  }

  /**
   * Read a full attachment record including the blob. Returns null if
   * the id is unknown.
   */
  async get(id: string): Promise<AttachmentRecord | null> {
    const row = await this.table.get(id)
    return row ?? null
  }

  /**
   * Read metadata (no blob) for one or more ids. Missing ids are
   * silently skipped — used by list-rendering UI that doesn't want to
   * surface orphan-reference errors loudly.
   */
  async getMeta(ids: string[]): Promise<AttachmentMetadata[]> {
    if (ids.length === 0) return []
    const rows = await this.table.bulkGet(ids)
    const out: AttachmentMetadata[] = []
    for (const row of rows) {
      if (row) out.push(toMetadata(row))
    }
    return out
  }

  /** All attachments' metadata (no blobs). */
  async getAll(): Promise<AttachmentMetadata[]> {
    const rows = await this.table.toArray()
    return rows.map(toMetadata)
  }

  async remove(id: string): Promise<void> {
    await this.table.delete(id)
  }

  /** Wipe every attachment. Called from `LocalDataStore.delete()`. */
  async clear(): Promise<void> {
    await this.table.clear()
  }
}

function toMetadata(record: AttachmentRecord): AttachmentMetadata {
  const { blob: _blob, ...meta } = record
  void _blob
  return meta
}

/**
 * Read a File's bytes into an ArrayBuffer. Prefers the modern
 * `File.arrayBuffer()` method when available; falls back to FileReader
 * for jsdom + older environments that don't implement it.
 */
async function readFileBytes(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer()
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result)
      } else {
        reject(new Error('FileReader returned non-ArrayBuffer result'))
      }
    }
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'))
    reader.readAsArrayBuffer(file)
  })
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // jsdom-friendly fallback. Real browsers always provide randomUUID.
  return `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}
