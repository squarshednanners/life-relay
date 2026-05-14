/**
 * Cover-photo export/import round-trip (Story 1.7c, AC4 + AC7).
 *
 * Pins: a vault with a cover-photo reference + blob survives encrypted
 * export → wipe → import → load. The top-level
 * `coverPhotoAttachmentId` field is picked up by `collectAttachmentIds`
 * (not just the schema-walk for per-section attachments).
 */
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { LocalDataStore } from '../LocalDataStore'
import { AttachmentStore } from '../AttachmentStore'
import type { DeathboxData } from '@/models/DeathboxData'

function fakeFile(bytes: number[], name: string, mimeType = 'image/png'): File {
  return new File([new Uint8Array(bytes)], name, { type: mimeType })
}

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  await new LocalDataStore().delete()
})

describe('cover-photo round-trip', () => {
  it('preserves the cover-photo blob + reference across export/wipe/import', async () => {
    const store = new LocalDataStore()
    const attachments = new AttachmentStore()
    const coverBytes = [0x89, 0x50, 0x4e, 0x47] // PNG magic header bytes
    const cover = await attachments.add(fakeFile(coverBytes, 'cover.png', 'image/png'))

    const vault: DeathboxData = {
      schemaVersion: 1,
      coverPhotoAttachmentId: cover.id,
      people: [{ id: 'p1', name: 'Anna' } as any],
    }
    await store.save(vault)

    const password = 'cover-roundtrip-pwd-2026'
    const encrypted = await store.exportToJSON(password)
    await store.delete()
    expect(await new AttachmentStore().getAll()).toEqual([])

    await store.importFromJSON(encrypted, password)
    const restored = await store.load()
    expect(restored?.coverPhotoAttachmentId).toBe(cover.id)

    const restoredBlob = await new AttachmentStore().get(cover.id)
    expect(restoredBlob).toBeTruthy()
    expect(Array.from(restoredBlob!.blob)).toEqual(coverBytes)
  })

  it('an export with no cover photo set produces a valid envelope with no extra ids', async () => {
    const store = new LocalDataStore()
    await store.save({ schemaVersion: 1 } as DeathboxData)
    const json = await store.exportToJSON()
    const parsed = JSON.parse(json)
    expect(parsed.envelopeVersion).toBe(1)
    expect(parsed.data.coverPhotoAttachmentId).toBeUndefined()
    expect(parsed.attachments).toEqual({})
  })

  it('an orphan coverPhotoAttachmentId (reference with no blob) does not break export', async () => {
    const store = new LocalDataStore()
    await store.save({
      schemaVersion: 1,
      coverPhotoAttachmentId: 'no-such-id',
    } as DeathboxData)
    // Should not throw — the schema walk silently skips missing blobs.
    const json = await store.exportToJSON()
    const parsed = JSON.parse(json)
    expect(parsed.data.coverPhotoAttachmentId).toBe('no-such-id')
    // The blob isn't in the store; envelope doesn't include it.
    expect(parsed.attachments['no-such-id']).toBeUndefined()
  })
})
