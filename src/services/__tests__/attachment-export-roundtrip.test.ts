/**
 * Attachment encrypted-export round-trip (Story 1.7, AC7 + AC8 + AC13).
 *
 * Pins the full contract: save a vault with attachments → encrypted
 * export with password → wipe IndexedDB → import → load → attachments
 * present with intact binary content. Any silent drift in the envelope
 * format or base64 encoding would break this.
 */
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { LocalDataStore } from '../LocalDataStore'
import { AttachmentStore } from '../AttachmentStore'
import type { DeathboxData } from '@/models/DeathboxData'

function fakeFile(bytes: number[], name: string, mimeType = 'application/pdf'): File {
  return new File([new Uint8Array(bytes)], name, { type: mimeType })
}

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  const store = new LocalDataStore()
  await store.delete()
})

describe('attachment round-trip — encrypted', () => {
  it('preserves binary content + metadata + references across export/wipe/import', async () => {
    const store = new LocalDataStore()
    const attachments = new AttachmentStore()
    // Two distinct binary payloads — bytes that JSON.stringify would
    // mangle if anything routed through the JSON path accidentally.
    const willBytes = [0x00, 0x01, 0x7f, 0x80, 0xfe, 0xff]
    const poaBytes = [0xde, 0xad, 0xbe, 0xef, 0x42]
    const willMeta = await attachments.add(fakeFile(willBytes, 'will.pdf'))
    const poaMeta = await attachments.add(fakeFile(poaBytes, 'poa.pdf'))

    const vault: DeathboxData = {
      schemaVersion: 1,
      legalDocuments: {
        willLocation: 'Top drawer',
        documentFiles: [willMeta.id, poaMeta.id],
      },
    } as any
    await store.save(vault)

    const password = 'attachment-roundtrip-test-pwd-2026'
    const encrypted = await store.exportToJSON(password)
    expect(encrypted.length).toBeGreaterThan(0)

    await store.delete()
    const wipedAttachments = await new AttachmentStore().getAll()
    expect(wipedAttachments).toEqual([])
    const wipedVault = await store.load()
    expect(wipedVault).toBeNull()

    await store.importFromJSON(encrypted, password)

    const restoredVault = await store.load()
    expect((restoredVault as any)?.legalDocuments?.documentFiles).toEqual([
      willMeta.id,
      poaMeta.id,
    ])

    const restoredWill = await new AttachmentStore().get(willMeta.id)
    expect(restoredWill).toBeTruthy()
    expect(restoredWill!.filename).toBe('will.pdf')
    expect(restoredWill!.mimeType).toBe('application/pdf')
    expect(Array.from(restoredWill!.blob)).toEqual(willBytes)

    const restoredPoa = await new AttachmentStore().get(poaMeta.id)
    expect(restoredPoa).toBeTruthy()
    expect(Array.from(restoredPoa!.blob)).toEqual(poaBytes)
  })

  it('preserves attachments through an unencrypted export too', async () => {
    const store = new LocalDataStore()
    const attachments = new AttachmentStore()
    const bytes = [1, 2, 3, 4, 5]
    const meta = await attachments.add(fakeFile(bytes, 'doc.pdf'))
    await store.save({
      schemaVersion: 1,
      legalDocuments: { documentFiles: [meta.id] },
    } as any)

    const json = await store.exportToJSON() // no password
    expect(json).toContain('envelopeVersion')

    await store.delete()
    await store.importFromJSON(json)

    const restored = await new AttachmentStore().get(meta.id)
    expect(restored).toBeTruthy()
    expect(Array.from(restored!.blob)).toEqual(bytes)
  })

  it('legacy exports without an envelope still import (backward compat)', async () => {
    const store = new LocalDataStore()
    // Manually build an old-style export: just the DeathboxData payload.
    const legacyExport = JSON.stringify({
      schemaVersion: 1,
      people: [{ id: 'p1', name: 'Anna' }],
    })
    await store.importFromJSON(legacyExport)
    const restored = await store.load()
    expect((restored as any)?.people?.[0]?.name).toBe('Anna')
  })

  it('export with no attachments still produces a valid envelope', async () => {
    const store = new LocalDataStore()
    await store.save({ schemaVersion: 1 } as DeathboxData)
    const json = await store.exportToJSON()
    const parsed = JSON.parse(json)
    expect(parsed.envelopeVersion).toBe(1)
    expect(parsed.attachments).toEqual({})
  })
})

describe('attachment round-trip — multi-section + nested array (Story 1.7b)', () => {
  it('preserves attachments referenced across property + lifeInsurance.policies + medicalInfo', async () => {
    const store = new LocalDataStore()
    const attachments = new AttachmentStore()
    const deedBytes = [0x44, 0x45, 0x45, 0x44] // "DEED"
    const policyBytes = [0x50, 0x4f, 0x4c, 0x43] // "POLC"
    const directiveBytes = [0x44, 0x4e, 0x52] // "DNR"
    const deed = await attachments.add(fakeFile(deedBytes, 'deed.pdf'))
    const policy = await attachments.add(fakeFile(policyBytes, 'policy.pdf'))
    const directive = await attachments.add(fakeFile(directiveBytes, 'advance-directive.pdf'))

    const vault: DeathboxData = {
      schemaVersion: 1,
      property: [{ id: 'pr1', address: '123 Main', documentFiles: [deed.id] }],
      lifeInsurance: {
        policies: [{ id: 'po1', company: 'Met', documentFiles: [policy.id] }],
      },
      // medicalInfo is also an array section per the schema registry.
      medicalInfo: [
        { id: 'm1', primaryPhysician: 'Dr. X', documentFiles: [directive.id] },
      ],
    } as any
    await store.save(vault)

    const password = 'multi-section-roundtrip-pwd'
    const encrypted = await store.exportToJSON(password)
    await store.delete()
    expect(await new AttachmentStore().getAll()).toEqual([])

    await store.importFromJSON(encrypted, password)
    const restored = await store.load()
    expect((restored as any)?.property?.[0]?.documentFiles).toEqual([deed.id])
    expect((restored as any)?.lifeInsurance?.policies?.[0]?.documentFiles).toEqual([policy.id])
    expect((restored as any)?.medicalInfo?.[0]?.documentFiles).toEqual([directive.id])

    const a = new AttachmentStore()
    expect(Array.from((await a.get(deed.id))!.blob)).toEqual(deedBytes)
    expect(Array.from((await a.get(policy.id))!.blob)).toEqual(policyBytes)
    expect(Array.from((await a.get(directive.id))!.blob)).toEqual(directiveBytes)
  })
})
