/**
 * PDF/UA-1 structure assertions for the runbook PDF (Story 1.2 AC4).
 *
 * Automated gate covers:
 *  - Catalog markers: MarkInfo (Marked: true), Lang, Title, ViewerPreferences
 *    — checked via `PDFDocument.load` + catalog inspection.
 *  - StructTreeRoot tree shape — checked by scanning the raw PDF bytes for
 *    `/S /H1`, `/S /H2`, `/S /P`, `/S /L`, `/S /LI` markers.
 *    Why bytes-not-objects: pdf-lib's load/parse roundtrip on a hand-built
 *    structure tree can fail to fully resolve indirect refs back into typed
 *    dicts. The raw-byte grep is robust to that and matches what real
 *    accessibility tools (PAC, screen readers) do — they parse the bytes,
 *    not the pdf-lib in-memory representation.
 *  - StructTreeRoot.ParentTree and StructTreeRoot.ParentTreeNextKey exist.
 *  - Each page carries /StructParents.
 *
 * NOT covered (deferred to a follow-up story): content-stream MCIDs (BDC/EMC
 * operators around each drawText call). Without those, PAC flags structure
 * elements as "no marked content reference". The structural primitives below
 * are required by AC4; PAC compliance is a manual verification step
 * documented in the story Dev Notes.
 */
import { describe, it, expect } from 'vitest'
import { PDFDocument, PDFName, PDFBool, PDFDict, PDFString, PDFHexString } from 'pdf-lib'
import { generateRunbookPdfDocument } from '../runbookPdf'
import { buildFixture } from './fixtures/deathboxData.fixture'

function bytesToString(bytes: Uint8Array): string {
  // PDFs are mostly ASCII for structure; content streams are binary but the
  // structure-tree dicts we grep for live in the trailing ASCII section.
  // Decode latin-1 to avoid throwing on binary bytes; a string round-trip
  // preserves all byte positions for substring scanning.
  let out = ''
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i])
  return out
}

describe('runbook PDF — PDF/UA-1 catalog markers', () => {
  it('catalog carries MarkInfo with Marked: true', async () => {
    const bytes = await generateRunbookPdfDocument(buildFixture())
    const reopened = await PDFDocument.load(bytes)
    const markInfo = reopened.catalog.get(PDFName.of('MarkInfo'))
    expect(markInfo).toBeDefined()
    const markInfoDict = markInfo as PDFDict
    expect(markInfoDict.get(PDFName.of('Marked'))).toBe(PDFBool.True)
  })

  it('catalog carries a StructTreeRoot', async () => {
    const bytes = await generateRunbookPdfDocument(buildFixture())
    const reopened = await PDFDocument.load(bytes)
    const structTreeRoot = reopened.catalog.get(PDFName.of('StructTreeRoot'))
    expect(structTreeRoot).toBeDefined()
  })

  it('document title is set', async () => {
    const bytes = await generateRunbookPdfDocument(buildFixture())
    const reopened = await PDFDocument.load(bytes)
    expect(reopened.getTitle()).toBe('Life Relay — For My Family')
  })

  it('document language is en-US', async () => {
    const bytes = await generateRunbookPdfDocument(buildFixture())
    const reopened = await PDFDocument.load(bytes)
    // Inspect via the PDFString/PDFHexString decoder — robust across both
    // catalog encodings. (pdf-lib has no `getLanguage()` accessor as of
    // v1.17.1; only `setLanguage()`.)
    const lang = reopened.catalog.get(PDFName.of('Lang'))
    if (lang instanceof PDFString || lang instanceof PDFHexString) {
      expect(lang.decodeText()).toBe('en-US')
    } else {
      throw new Error(
        `Expected Catalog.Lang to be a PDFString/PDFHexString, got ${lang?.constructor.name}`,
      )
    }
  })

  it('viewer preferences requests DisplayDocTitle', async () => {
    const bytes = await generateRunbookPdfDocument(buildFixture())
    const reopened = await PDFDocument.load(bytes)
    const vp = reopened.catalog.get(PDFName.of('ViewerPreferences'))
    expect(vp).toBeDefined()
    const vpDict = vp as PDFDict
    expect(vpDict.get(PDFName.of('DisplayDocTitle'))).toBe(PDFBool.True)
  })
})

describe('runbook PDF — StructTreeRoot tree shape (raw-byte scan)', () => {
  it('tree contains every element type AC4 requires (Document, H1, H2, P, L, LI)', async () => {
    const bytes = await generateRunbookPdfDocument(buildFixture())
    const text = bytesToString(bytes)

    // pdf-lib emits structure types as `/S /<Name>` (with whitespace) in the
    // serialized dicts. Multiple whitespace possible; match liberally.
    const has = (kind: string) =>
      new RegExp(`/S\\s*/${kind}\\b`).test(text)

    expect(has('Document')).toBe(true)
    expect(has('H1')).toBe(true)
    expect(has('H2')).toBe(true)
    expect(has('P')).toBe(true)
    expect(has('L')).toBe(true)
    expect(has('LI')).toBe(true)
  })

  it('multiple /H2 elements emitted (one per phase + Don\'ts)', async () => {
    const bytes = await generateRunbookPdfDocument(buildFixture())
    const text = bytesToString(bytes)
    const h2Count = (text.match(/\/S\s*\/H2\b/g) ?? []).length
    // Title page has no H2. Phase pages each emit one; "Important Don'ts" adds one more.
    expect(h2Count).toBeGreaterThanOrEqual(2)
  })

  it('H1 carries the title text as /T', async () => {
    const bytes = await generateRunbookPdfDocument(buildFixture())
    const text = bytesToString(bytes)
    // The H1 StructElem includes `/S /H1` and `/T (For My Family)` in its dict.
    // Look for /T (For My Family) appearing somewhere in the PDF text.
    expect(text).toMatch(/\/T\s*\(For My Family\)/)
  })

  it('StructTreeRoot has ParentTree and ParentTreeNextKey', async () => {
    const bytes = await generateRunbookPdfDocument(buildFixture())
    const text = bytesToString(bytes)
    expect(text).toMatch(/\/ParentTree\s/)
    expect(text).toMatch(/\/ParentTreeNextKey\s+\d+/)
  })

  it('every page carries /StructParents', async () => {
    const bytes = await generateRunbookPdfDocument(buildFixture())
    const reopened = await PDFDocument.load(bytes)
    for (let i = 0; i < reopened.getPageCount(); i++) {
      const page = reopened.getPage(i)
      const sp = page.node.get(PDFName.of('StructParents'))
      expect(sp).toBeDefined()
    }
  })
})
