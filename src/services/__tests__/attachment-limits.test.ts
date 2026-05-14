/**
 * Attachment export-limit tests (Story 1.7, AC7 + AC13).
 *
 * Pins the inline export limits and the hard-error path: 25 MB per file
 * and 250 MB total. Anything beyond → `AttachmentExportLimitError`,
 * throwing BEFORE any partial write hits disk.
 */
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { LocalDataStore } from '../LocalDataStore'
import { AttachmentStore } from '../AttachmentStore'
import { AttachmentExportLimitError } from '../errors'
import type { DeathboxData } from '@/models/DeathboxData'

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  await new LocalDataStore().delete()
})

/**
 * Helper: push a synthetic AttachmentRecord directly into Dexie with a
 * fake-large `sizeBytes`. Avoids actually allocating 26 MB+ in the test.
 * The `blob` is empty; the limit check fires on `sizeBytes` first.
 */
async function pushSyntheticAttachment(
  id: string,
  filename: string,
  sizeBytes: number,
): Promise<void> {
  const { _getAttachmentsTable } = await import('../LocalDataStore')
  await _getAttachmentsTable().put({
    id,
    filename,
    mimeType: 'application/pdf',
    sizeBytes,
    uploadedAt: new Date().toISOString(),
    blob: new Uint8Array(0),
  })
}

describe('attachment export limits', () => {
  it('throws AttachmentExportLimitError when a single attachment exceeds 25 MB', async () => {
    const store = new LocalDataStore()
    const oversizeId = 'oversize-id'
    await pushSyntheticAttachment(oversizeId, 'huge.pdf', 26 * 1024 * 1024)
    await store.save({
      schemaVersion: 1,
      legalDocuments: { documentFiles: [oversizeId] },
    } as any)

    await expect(store.exportToJSON('pwd')).rejects.toBeInstanceOf(AttachmentExportLimitError)
  })

  it('throws AttachmentExportLimitError when the total exceeds 250 MB', async () => {
    const store = new LocalDataStore()
    const ids: string[] = []
    for (let i = 0; i < 11; i++) {
      const id = `bulk-${i}`
      // 24 MB each × 11 = 264 MB total — over the 250 MB cap.
      await pushSyntheticAttachment(id, `f${i}.pdf`, 24 * 1024 * 1024)
      ids.push(id)
    }
    await store.save({
      schemaVersion: 1,
      legalDocuments: { documentFiles: ids },
    } as any)

    await expect(store.exportToJSON('pwd')).rejects.toBeInstanceOf(AttachmentExportLimitError)
  })

  it('throws before partial writes — no JSON output on rejection', async () => {
    const store = new LocalDataStore()
    await pushSyntheticAttachment('oversize-id', 'huge.pdf', 26 * 1024 * 1024)
    await store.save({
      schemaVersion: 1,
      legalDocuments: { documentFiles: ['oversize-id'] },
    } as any)

    let caught: unknown = null
    try {
      await store.exportToJSON('pwd')
    } catch (err) {
      caught = err
    }
    expect(caught).toBeInstanceOf(AttachmentExportLimitError)
    // The vault data on disk is unchanged.
    const stillThere = await store.load()
    expect((stillThere as any)?.legalDocuments?.documentFiles).toEqual(['oversize-id'])
  })

  it('accepts exactly-at-limit attachments (25 MB exact)', async () => {
    const store = new LocalDataStore()
    await pushSyntheticAttachment('at-limit', 'file.pdf', 25 * 1024 * 1024)
    await store.save({
      schemaVersion: 1,
      legalDocuments: { documentFiles: ['at-limit'] },
    } as any)

    // No throw — the export succeeds. (The blob is empty in this
    // synthetic test, but sizeBytes is the gate.)
    const json = await store.exportToJSON()
    expect(json.length).toBeGreaterThan(0)
  })
})
