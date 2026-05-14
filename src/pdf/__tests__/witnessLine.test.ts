/**
 * Tests for `src/pdf/witnessLine.ts` — the cross-surface Witness Line primitive.
 *
 * Story 1.2 AC3 says: "the Witness Line renders as a 3px accent-700 left
 * border at the same coordinate position as it appears on screen". Story
 * 1.5 extends this with coordinate-parity tests and a cross-surface
 * offset assertion (screen `space-6` === PDF 24pt).
 */
import { describe, it, expect, vi } from 'vitest'
import { PDFDocument, rgb } from 'pdf-lib'
import { drawWitnessLine } from '../witnessLine'
import { color, witnessLine, spacing, pdfSpacing, pdfRgb } from '@/tokens'

describe('drawWitnessLine', () => {
  it('draws a vertical line on the page without throwing', async () => {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([612, 792])
    expect(() =>
      drawWitnessLine(page, { x: 54, yTop: 700, yBottom: 600 }),
    ).not.toThrow()

    const bytes = await pdfDoc.save()
    expect(bytes.byteLength).toBeGreaterThan(0)
    const header = String.fromCharCode(...bytes.slice(0, 4))
    expect(header).toBe('%PDF')
  })

  it('uses tokens.witnessLine.widthPt (3) and accent-700 color', () => {
    // The contract: any change to these token values must be intentional and
    // reflected across both surfaces. This test pins them.
    expect(witnessLine.widthPt).toBe(3)

    const [r, g, b] = pdfRgb(color.accent['700'])
    // Deep Warm Umber HSL(25, 35%, 40%): warm brown with R > G > B.
    expect(r).toBeGreaterThan(g)
    expect(g).toBeGreaterThan(b)
    // Sanity: not pure black (would mean an HSL parse failure).
    expect(r).toBeGreaterThan(0.3)
    expect(r).toBeLessThan(0.6)
  })

  it('calls page.drawLine with the canonical token-bound parameters', async () => {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([612, 792])
    const drawLineSpy = vi.spyOn(page, 'drawLine')

    drawWitnessLine(page, { x: 54, yTop: 700, yBottom: 600 })

    expect(drawLineSpy).toHaveBeenCalledTimes(1)
    const callArgs = drawLineSpy.mock.calls[0][0]

    // x is preserved verbatim — both endpoints share the same x (vertical
    // line) at the section's content-block left edge.
    expect(callArgs.start.x).toBe(54)
    expect(callArgs.end.x).toBe(54)

    // pdf-lib bottom-left origin: start.y is the BOTTOM (smaller number),
    // end.y is the TOP (larger). The helper's API swaps yTop/yBottom into
    // this convention.
    expect(callArgs.start.y).toBe(600)
    expect(callArgs.end.y).toBe(700)

    // Stroke width and color flow from tokens.
    expect(callArgs.thickness).toBe(witnessLine.widthPt)

    const [r, g, b] = pdfRgb(color.accent['700'])
    const expectedColor = rgb(r, g, b)
    // pdf-lib's rgb() returns a Color object with `type` and the three
    // channels; compare shape rather than reference equality.
    expect(callArgs.color).toEqual(expectedColor)

    drawLineSpy.mockRestore()
  })

  it('throws when yBottom > yTop (guards swapped-args caller bug)', async () => {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([612, 792])
    expect(() =>
      drawWitnessLine(page, { x: 54, yTop: 600, yBottom: 700 }),
    ).toThrowError(/yBottom.*must be <= yTop/i)
  })

  it('enforces cross-surface content-offset equality (screen space-6 === PDF 24pt)', () => {
    // The Witness Line's left edge is at the section's content-block left
    // edge. Content text is offset RIGHT of that line by `space-6` on
    // screen and `witnessLinePaddingLeftPt` (24pt) in PDF. The two must
    // be numerically equal so a section's visual layout stays consistent
    // across surfaces.
    //
    // Screen-side: `spacing.witnessLinePaddingLeft` = '1.5rem'. With
    // Tailwind's default 1rem = 16px, that's 24px.
    //
    // PDF-side: `pdfSpacing.witnessLinePaddingLeftPt` = 24 (pt, 1pt ≈ 1px
    // at 1:1 mapping which pdf-lib uses by default).
    expect(spacing.witnessLinePaddingLeft).toBe('1.5rem')
    const screenPx = parseFloat(spacing.witnessLinePaddingLeft) * 16 // 1rem = 16px
    expect(screenPx).toBe(24)
    expect(pdfSpacing.witnessLinePaddingLeftPt).toBe(24)
    expect(screenPx).toBe(pdfSpacing.witnessLinePaddingLeftPt)
  })

  // Owned by Story 1.6 — Typographic Inversion introduces <SectionView>,
  // the schema-driven section shell. When it ships, add a parity test
  // here asserting it draws the witness line at the same x-coordinate
  // convention as <SectionHeader> and <WitnessSection>.
  it.todo('SectionView witness line parity (Story 1.6)')
})
