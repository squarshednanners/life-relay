/**
 * Cross-surface Typographic Inversion (Story 1.6 AC8).
 *
 * Asserts the full-vault PDF (`generator.ts` via `schemaToPdf.ts`) renders
 * field labels and values with the correct sizes and fonts per the
 * inversion contract. The PDF uses smaller, print-appropriate sizes than
 * the screen (16/14px) because dense runbook PDFs benefit from compact
 * typography; the inversion (label smaller + lighter than value) is
 * preserved by weight + color delta + stacked layout, not by dramatic
 * absolute size difference.
 *
 *   Label  — pdfFont.bodyMedium @ 8.5pt
 *   Prose  — pdfFont.bodyRegular @ 10pt
 *   Mono   — pdfFont.monoRegular @ 10pt
 *
 * Approach: render a small fixture vault that exercises both prose and
 * mono fields, intercept the PDF page's drawText operations via a spy on
 * `PDFPage.prototype.drawText`, then group the calls by font + size and
 * assert each expected combination shows up.
 *
 * Why this layer: a coordinate-perfect snapshot is brittle to layout
 * tweaks; a high-level contract check on (size, font) pairings catches the
 * regression cleanly — "labels at body-sm via bodyMedium; prose values at
 * body-lg via bodyRegular; mono values at mono-md via monoRegular".
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PDFPage } from 'pdf-lib'
import { generatePDFDocument } from '../generator'
import { pdfTypeScale } from '@/tokens'
import type { DeathboxData } from '@/models/DeathboxData'

interface DrawTextCall {
  text: string
  size: number
  fontName: string
}

let drawTextSpy: ReturnType<typeof vi.spyOn>
let drawTextCalls: DrawTextCall[] = []
// Capture the real drawText BEFORE vi.spyOn replaces it. Jest exposed the
// original via `mock.wrappedMethod`, but vitest does not — so we grab it
// explicitly and forward inside the mock implementation. Without this the
// PDF pages end up with empty content streams (the recorder works fine but
// any downstream PDF inspection would explode).
const ORIGINAL_DRAW_TEXT = PDFPage.prototype.drawText

beforeEach(() => {
  drawTextCalls = []
  drawTextSpy = vi
    .spyOn(PDFPage.prototype, 'drawText')
    .mockImplementation(function (this: PDFPage, text, options) {
      const size = options?.size ?? 0
      // The PDFFont exposes its name via `.name` (pdf-lib internals expose
      // the embedded subset font name on the public API). When the font
      // isn't passed, label as `<default>`.
      const fontName = (options?.font as { name?: string } | undefined)?.name ?? '<default>'
      drawTextCalls.push({ text: String(text), size, fontName })
      // Forward to the real method so the PDF actually contains text and
      // downstream assertions about page content stay valid.
      return ORIGINAL_DRAW_TEXT.call(this, text, options)
    })
})

afterEach(() => {
  drawTextSpy.mockRestore()
})

function makeMinimalVault(): DeathboxData {
  // Build the smallest possible valid DeathboxData. We only need the
  // generator to traverse some schema fields — a few people + one financial
  // account exercise both prose (names, addresses) and mono
  // (accountNumber). Everything else can be empty.
  const data: Partial<DeathboxData> = {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    people: [
      {
        id: 'p1',
        firstName: 'Anna',
        lastName: 'Voss',
        email: 'anna@example.com',
        phone: '+1-512-555-0100',
      },
    ] as unknown as DeathboxData['people'],
    financialAccounts: [
      {
        id: 'fa1',
        institutionName: 'First Federal',
        accountNumber: '0001-2345-6789',
        accountType: 'checking',
      },
    ] as unknown as DeathboxData['financialAccounts'],
  }
  return data as DeathboxData
}

function callsAtSize(size: number): DrawTextCall[] {
  return drawTextCalls.filter(c => c.size === size)
}

function callsWithFont(substring: string): DrawTextCall[] {
  return drawTextCalls.filter(c => c.fontName.toLowerCase().includes(substring.toLowerCase()))
}

describe('Typographic Inversion — cross-surface PDF', () => {
  // Local mirrors of the constants defined inside `addField` in
  // `generator.ts`. If you change the PDF body sizes there, update these
  // and the inversion-test assertions stay accurate.
  const PDF_LABEL_SIZE = 8.5
  const PDF_VALUE_PROSE_SIZE = 10
  const PDF_VALUE_MONO_SIZE = 10

  it('renders labels at 8.5pt with the bodyMedium (Inter Medium) font', async () => {
    const data = makeMinimalVault()
    await generatePDFDocument(data)

    const labelDraws = callsAtSize(PDF_LABEL_SIZE)
    expect(labelDraws.length).toBeGreaterThan(0)

    // AND semantics — must match BOTH `inter` AND `medium` to avoid
    // alternation false-positives.
    const labelFontDraws = labelDraws.filter(c => {
      const lower = c.fontName.toLowerCase()
      return lower.includes('inter') && lower.includes('medium')
    })
    expect(labelFontDraws.length).toBeGreaterThan(0)
  })

  it('renders prose values at 10pt with the bodyRegular (Inter Regular) font', async () => {
    const data = makeMinimalVault()
    await generatePDFDocument(data)

    const proseDraws = callsAtSize(PDF_VALUE_PROSE_SIZE)
    expect(proseDraws.length).toBeGreaterThan(0)

    const proseFontDraws = proseDraws.filter(c => {
      const lower = c.fontName.toLowerCase()
      return lower.includes('inter') && lower.includes('regular')
    })
    expect(proseFontDraws.length).toBeGreaterThan(0)
  })

  it('renders mono values at 10pt with the monoRegular (JetBrains Mono) font', async () => {
    const data = makeMinimalVault()
    await generatePDFDocument(data)

    const monoDraws = callsAtSize(PDF_VALUE_MONO_SIZE)
    expect(monoDraws.length).toBeGreaterThan(0)

    // JetBrains Mono is the monoRegular role. Account number is the mono
    // source for the minimal fixture vault.
    const monoFontDraws = callsWithFont('jetbrains').filter(
      c => c.size === PDF_VALUE_MONO_SIZE,
    )
    expect(monoFontDraws.length).toBeGreaterThan(0)
  })

  it('pdfTypeScale (heading + primary content) still pins screen-PDF parity', () => {
    // The `pdfTypeScale` tokens are the source of truth for HEADING-level
    // and primary-content sizes (title page, TOC, section headers — all
    // surfaces where screen and print should look identical). The
    // dense body-field rendering inside `addField` uses smaller
    // PDF-specific sizes (above) for print density.
    expect(pdfTypeScale.bodySm).toBe(14)
    expect(pdfTypeScale.bodyMd).toBe(16)
    expect(pdfTypeScale.monoMd).toBe(16)
  })
})
