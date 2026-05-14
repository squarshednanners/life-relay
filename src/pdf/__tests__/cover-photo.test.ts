/**
 * Cover-photo embedding in the vault PDF (Story 1.7c, AC5 + AC7).
 *
 * Tests two paths:
 *   - PNG cover photo embeds successfully + the resulting PDF carries
 *     at least one image XObject.
 *   - Missing-blob case (referenced id has no attachment) does NOT
 *     throw — PDF generates fine without the cover.
 *
 * jsdom has no Canvas/Image, so this test only exercises the
 * native-PNG embed path (image/png MIME). The Canvas conversion path
 * for WebP/AVIF/HEIC is browser-only and tested by hand.
 */
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { PDFDocument } from 'pdf-lib'
import { LocalDataStore } from '@/services/LocalDataStore'
import { AttachmentStore } from '@/services/AttachmentStore'
import { generatePDFDocument } from '../generator'
import type { DeathboxData } from '@/models/DeathboxData'

/**
 * A canonical 1×1 black PNG. Sourced as a base64 string of a real,
 * fully-valid PNG (signature + IHDR + IDAT + IEND, deflate stream
 * intact) so pdf-lib's UPNG decoder can parse it without choking.
 */
const ONE_PIXEL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
const ONE_PIXEL_PNG = (() => {
  const binary = atob(ONE_PIXEL_PNG_BASE64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
})()

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  await new LocalDataStore().delete()
})

describe('PDF cover photo', () => {
  it('embeds the cover photo image XObject in the generated PDF', async () => {
    const attachments = new AttachmentStore()
    const file = new File([ONE_PIXEL_PNG as BlobPart], 'cover.png', { type: 'image/png' })
    const cover = await attachments.add(file)

    const data: DeathboxData = {
      schemaVersion: 1,
      coverPhotoAttachmentId: cover.id,
    }
    const pdfBytes = await generatePDFDocument(data)
    expect(pdfBytes.byteLength).toBeGreaterThan(0)

    // Open the produced PDF and confirm at least one image XObject is
    // present. pdf-lib's loadable PDF metadata exposes embedded images
    // via the indirect objects; a simpler check is to scan the raw
    // bytes for the PNG signature (which pdf-lib reproduces in the
    // image stream).
    const parsed = await PDFDocument.load(pdfBytes)
    expect(parsed.getPageCount()).toBeGreaterThan(0)

    // Indirect: scan the PDF for "/Subtype /Image" — pdf-lib's
    // embedded image XObjects always carry this marker.
    const pdfText = new TextDecoder('latin1').decode(pdfBytes)
    expect(pdfText.includes('/Subtype /Image') || pdfText.includes('/Subtype/Image')).toBe(true)
  })

  it('does NOT throw when the cover-photo reference is missing', async () => {
    const data: DeathboxData = {
      schemaVersion: 1,
      coverPhotoAttachmentId: 'no-such-id',
    }
    await expect(generatePDFDocument(data)).resolves.toBeDefined()
  })

  it('produces a valid PDF when no cover photo is set', async () => {
    const data: DeathboxData = { schemaVersion: 1 }
    const pdfBytes = await generatePDFDocument(data)
    const parsed = await PDFDocument.load(pdfBytes)
    expect(parsed.getPageCount()).toBeGreaterThan(0)
  })
})
