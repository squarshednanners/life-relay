/**
 * AttachmentStore CRUD + binary-integrity tests (Story 1.7, AC3 + AC13).
 *
 * Pins the non-negotiable: binary content survives a round trip through
 * Dexie without any byte loss or `JSON.parse(JSON.stringify)`-style
 * corruption. The `Uint8Array.from([...])` fixtures use byte values that
 * would round-trip through JSON as garbage if the persistence path went
 * through `stringify` accidentally.
 */
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { AttachmentStore } from '../AttachmentStore'

function fakeFile(bytes: number[], name = 'test.bin', mimeType = 'application/octet-stream'): File {
  return new File([new Uint8Array(bytes)], name, { type: mimeType })
}

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  // Dexie holds a long-lived connection to the previous IDBFactory.
  // Clearing the attachments table is the cheap way to isolate tests
  // without having to close + reopen the Dexie database on each one.
  await new AttachmentStore().clear()
})

describe('AttachmentStore — add + get', () => {
  it('persists a file and returns metadata', async () => {
    const store = new AttachmentStore()
    const meta = await store.add(fakeFile([1, 2, 3, 4, 5], 'will.pdf', 'application/pdf'))
    expect(meta.id).toMatch(/.+/)
    expect(meta.filename).toBe('will.pdf')
    expect(meta.mimeType).toBe('application/pdf')
    expect(meta.sizeBytes).toBe(5)
    expect(meta.uploadedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    // Metadata-only return value has no blob to avoid memory bloat.
    expect((meta as any).blob).toBeUndefined()
  })

  it('round-trips binary content with byte-level integrity', async () => {
    const store = new AttachmentStore()
    // 0xFF, 0x00, 0x80 are bytes that JSON.parse(JSON.stringify) would
    // mangle if the store accidentally routed through that path.
    const original = [0x00, 0x01, 0x7f, 0x80, 0xfe, 0xff]
    const meta = await store.add(fakeFile(original, 'binary.bin'))
    const loaded = await store.get(meta.id)
    expect(loaded).toBeTruthy()
    expect(Array.from(loaded!.blob)).toEqual(original)
    expect(loaded!.sizeBytes).toBe(original.length)
  })

  it('defaults mimeType to application/octet-stream when File has no type', async () => {
    const store = new AttachmentStore()
    const file = new File([new Uint8Array([1])], 'unknown', { type: '' })
    const meta = await store.add(file)
    expect(meta.mimeType).toBe('application/octet-stream')
  })

  it('returns null on unknown id', async () => {
    const store = new AttachmentStore()
    expect(await store.get('no-such-id')).toBeNull()
  })

  it('rejects files over the per-call max size limit', async () => {
    const store = new AttachmentStore()
    await expect(store.add(fakeFile([1, 2, 3, 4, 5]), 4)).rejects.toThrow(/exceeds/)
  })

  it('accepts files at exactly the size limit', async () => {
    const store = new AttachmentStore()
    const meta = await store.add(fakeFile([1, 2, 3, 4]), 4)
    expect(meta.sizeBytes).toBe(4)
  })
})

describe('AttachmentStore — getMeta', () => {
  it('returns metadata for known ids in input order', async () => {
    const store = new AttachmentStore()
    const a = await store.add(fakeFile([1], 'a.bin'))
    const b = await store.add(fakeFile([2], 'b.bin'))
    const got = await store.getMeta([a.id, b.id])
    expect(got).toHaveLength(2)
    expect(got[0].filename).toBe('a.bin')
    expect(got[1].filename).toBe('b.bin')
  })

  it('silently skips unknown ids', async () => {
    const store = new AttachmentStore()
    const a = await store.add(fakeFile([1], 'a.bin'))
    const got = await store.getMeta([a.id, 'no-such-id', 'another-missing-id'])
    expect(got).toHaveLength(1)
    expect(got[0].id).toBe(a.id)
  })

  it('returns empty array on empty input', async () => {
    const store = new AttachmentStore()
    expect(await store.getMeta([])).toEqual([])
  })
})

describe('AttachmentStore — getAll', () => {
  it('returns metadata for every attachment', async () => {
    const store = new AttachmentStore()
    await store.add(fakeFile([1], 'a.bin'))
    await store.add(fakeFile([2], 'b.bin'))
    const all = await store.getAll()
    expect(all).toHaveLength(2)
    expect(all.every(r => (r as any).blob === undefined)).toBe(true)
  })

  it('returns empty array on a fresh database', async () => {
    const store = new AttachmentStore()
    expect(await store.getAll()).toEqual([])
  })
})

describe('AttachmentStore — remove + clear', () => {
  it('remove deletes one attachment', async () => {
    const store = new AttachmentStore()
    const a = await store.add(fakeFile([1], 'a.bin'))
    const b = await store.add(fakeFile([2], 'b.bin'))
    await store.remove(a.id)
    expect(await store.get(a.id)).toBeNull()
    expect(await store.get(b.id)).toBeTruthy()
  })

  it('remove on unknown id is a no-op (does not throw)', async () => {
    const store = new AttachmentStore()
    await expect(store.remove('no-such-id')).resolves.toBeUndefined()
  })

  it('clear wipes every attachment', async () => {
    const store = new AttachmentStore()
    await store.add(fakeFile([1], 'a.bin'))
    await store.add(fakeFile([2], 'b.bin'))
    await store.clear()
    expect(await store.getAll()).toEqual([])
  })
})

describe('AttachmentStore — id stability', () => {
  it('generates unique ids across rapid adds', async () => {
    const store = new AttachmentStore()
    const ids = new Set<string>()
    for (let i = 0; i < 20; i++) {
      const meta = await store.add(fakeFile([i], `f${i}.bin`))
      ids.add(meta.id)
    }
    expect(ids.size).toBe(20)
  })
})
