/**
 * Golden-fixture tests for the attorney-prep thin renderer.
 *
 * Asserts:
 *  1. The schema-driven data plan (`collectFieldsByPdfView('attorneyPrep')`)
 *     is stable for the canonical fixture.
 *  2. The full generator produces a valid multi-page PDF.
 *
 * Renderer-side concerns NOT covered here (intentional — they're layout, not
 * content): title page layout, Trust Planning Considerations aggregation,
 * Attorney Meeting Checklist content (sourced from willPrepCategories, which
 * has its own tests).
 */
import { describe, it, expect } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { generateAttorneyPrepPdf } from '../attorneyPrepPdf'
import { collectFieldsByPdfView } from '../schemaPdfViews'
import { buildFixture } from './fixtures/deathboxData.fixture'
import { serializeSections } from './fixtures/serialize'

describe('attorneyPrepPdf — schema-driven data plan', () => {
  it('matches the snapshot for the canonical fixture', () => {
    const sections = collectFieldsByPdfView('attorneyPrep', buildFixture())
    expect(serializeSections(sections)).toMatchSnapshot()
  })
})

describe('attorneyPrepPdf — generator output', () => {
  it('produces a valid multi-page PDF', async () => {
    const bytes = await generateAttorneyPrepPdf(buildFixture())

    expect(bytes).toBeInstanceOf(Uint8Array)
    const header = String.fromCharCode(...bytes.slice(0, 4))
    expect(header).toBe('%PDF')

    const reopened = await PDFDocument.load(bytes)
    // Title page + content pages — exact count is layout-driven but fixture
    // has enough sections to require at least 3 pages.
    expect(reopened.getPageCount()).toBeGreaterThanOrEqual(3)
    const [page] = reopened.getPages()
    expect(Math.round(page.getWidth())).toBe(612)
    expect(Math.round(page.getHeight())).toBe(792)
  })

  it('produces a valid PDF for a near-empty vault', async () => {
    const bytes = await generateAttorneyPrepPdf({
      schemaVersion: 1,
      updatedAt: '2026-05-12T12:00:00.000Z',
    } as never)
    const reopened = await PDFDocument.load(bytes)
    expect(reopened.getPageCount()).toBeGreaterThanOrEqual(1)
  })
})
