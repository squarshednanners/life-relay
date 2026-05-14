/**
 * Tests for `src/pdf/fonts.ts` — the PDF font loader + embedder.
 *
 * Covers the contract Story 1.2 AC2 depends on:
 *   - All 6 role identifiers resolve to a PDFFont
 *   - Embedded fonts can render text (smoke-test via a one-off PDFDocument)
 *   - Repeated calls in one session don't re-fetch (cache contract)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { embedPdfFonts, _resetFontCache } from '../fonts'

describe('embedPdfFonts', () => {
  // Reset the module-level font byte cache around every test so each case
  // sees the same fresh state regardless of test order. Without this, a
  // case that populates the cache then a later case that spies on `fetch`
  // would observe fewer calls than expected.
  beforeEach(() => {
    _resetFontCache()
  })
  afterEach(() => {
    _resetFontCache()
  })

  it('resolves all 6 role identifiers to a PDFFont', async () => {
    const pdfDoc = await PDFDocument.create()
    const fonts = await embedPdfFonts(pdfDoc)

    expect(fonts.headingRegular).toBeDefined()
    expect(fonts.headingMedium).toBeDefined()
    expect(fonts.headingItalic).toBeDefined()
    expect(fonts.bodyRegular).toBeDefined()
    expect(fonts.bodyMedium).toBeDefined()
    expect(fonts.monoRegular).toBeDefined()

    // Each font reports its own name (proves embedding completed).
    expect(fonts.headingRegular.name).toContain('Source')
    expect(fonts.bodyRegular.name).toContain('Inter')
    expect(fonts.monoRegular.name).toContain('JetBrains')
  })

  it('embedded fonts can render text into a generated PDF', async () => {
    const pdfDoc = await PDFDocument.create()
    const fonts = await embedPdfFonts(pdfDoc)
    const page = pdfDoc.addPage([612, 792])

    expect(() =>
      page.drawText('Eleanor Vance', {
        x: 72,
        y: 720,
        size: 18,
        font: fonts.headingMedium,
      }),
    ).not.toThrow()

    const bytes = await pdfDoc.save()
    expect(bytes.byteLength).toBeGreaterThan(0)
    const header = String.fromCharCode(...bytes.slice(0, 4))
    expect(header).toBe('%PDF')
  })

  it('caches byte buffers across documents (single fetch per font URL)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const docA = await PDFDocument.create()
    await embedPdfFonts(docA)
    const fetchCallsAfterFirst = fetchSpy.mock.calls.length

    const docB = await PDFDocument.create()
    await embedPdfFonts(docB)

    // Second document should hit the cache for all 6 fonts.
    expect(fetchSpy.mock.calls.length).toBe(fetchCallsAfterFirst)
    expect(fetchCallsAfterFirst).toBe(6)

    fetchSpy.mockRestore()
  })

  it('throws a useful error when a font URL is unreachable', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () =>
      new Response(null, { status: 404 })) as typeof fetch

    const pdfDoc = await PDFDocument.create()
    await expect(embedPdfFonts(pdfDoc)).rejects.toThrow(
      /PDF font fetch failed \(404\)/,
    )

    globalThis.fetch = originalFetch
  })

  it('failed fetches do not poison the cache — a retry can succeed', async () => {
    // Drive a 404 once; then restore the shim and retry — must succeed.
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () =>
      new Response(null, { status: 404 })) as typeof fetch

    const docA = await PDFDocument.create()
    await expect(embedPdfFonts(docA)).rejects.toThrow(
      /PDF font fetch failed/,
    )

    globalThis.fetch = originalFetch
    const docB = await PDFDocument.create()
    const fonts = await embedPdfFonts(docB)
    expect(fonts.headingRegular).toBeDefined()
  })
})
