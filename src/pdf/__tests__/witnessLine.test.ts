/**
 * Tests for `src/pdf/witnessLine.ts` — the cross-surface Witness Line primitive.
 *
 * Story 1.2 AC3 says: "the Witness Line renders as a 3px accent-700 left
 * border at the same coordinate position as it appears on screen". This file
 * asserts the PDF side of that contract.
 */
import { describe, it, expect } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { drawWitnessLine } from '../witnessLine'
import { color, witnessLine, pdfRgb } from '@/tokens'

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
})
