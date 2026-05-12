/**
 * Witness Line cross-surface primitive (PDF side).
 *
 * The 3pt accent-700 left border that marks every section containing
 * user-recorded data. Renders identically in:
 *   - Tailwind CSS: `border-l-[3px] border-l-[--color-accent] pl-6`
 *     (declared per UX Step 8; implemented in `<WitnessSection>` — Story 1.5)
 *   - pdf-lib: a vertical line draw via this helper
 *
 * Both surfaces consume the same tokens (`tokens.witnessLine.widthPt`,
 * `tokens.color.accent['700']`, `tokens.pdfSpacing.witnessLinePaddingLeftPt`).
 *
 * Cross-surface contract — DO NOT MODIFY this file without verifying the
 * screen `<WitnessSection>` wrapper (Story 1.5) renders identically. The two
 * must remain visually equivalent: same color, same stroke width, same
 * content offset.
 */
import { rgb } from 'pdf-lib'
import type { PDFPage } from 'pdf-lib'
import { color, witnessLine, pdfRgb } from '@/tokens'

/**
 * Default Witness Line height for a single section header (15pt — matches
 * the cap height + leading of the heading-md type scale at PDF point sizes).
 * Use the `height` form of `drawWitnessLine` rather than passing raw
 * `yTop`/`yBottom` so all generators draw the same-sized line by default.
 */
export const WITNESS_LINE_DEFAULT_HEIGHT = 15

export interface WitnessLineArgs {
  /** X coordinate of the line (left edge of the section). */
  x: number
  /** Top Y coordinate (higher number in pdf-lib's bottom-left origin). */
  yTop: number
  /** Bottom Y coordinate (lower number). Must be <= yTop. */
  yBottom: number
}

/**
 * Draw the Witness Line at the given coordinates. Uses the canonical
 * `tokens.witnessLine.widthPt` and `tokens.color.accent['700']`.
 *
 * Throws if `yBottom > yTop` — the bottom must be below the top in
 * pdf-lib's bottom-left origin coordinate space. Catches a class of subtle
 * caller bugs where swapped args would silently produce a zero-length line.
 */
export function drawWitnessLine(page: PDFPage, args: WitnessLineArgs): void {
  const { x, yTop, yBottom } = args
  if (yBottom > yTop) {
    throw new Error(
      `drawWitnessLine: yBottom (${yBottom}) must be <= yTop (${yTop}) — pdf-lib uses bottom-left origin, so yTop is the larger value.`,
    )
  }
  page.drawLine({
    start: { x, y: yBottom },
    end: { x, y: yTop },
    thickness: witnessLine.widthPt,
    color: rgb(...pdfRgb(color.accent['700'])),
  })
}
