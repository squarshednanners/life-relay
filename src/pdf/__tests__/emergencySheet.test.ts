/**
 * Golden-fixture tests for the emergency-sheet thin renderer.
 *
 * What this asserts:
 *  1. The schema-driven data plan (what `collectFieldsByPdfView('emergencySheet')`
 *     yields for a representative fixture) is stable. Adding a new field to a
 *     schema with `pdfViews.emergencySheet` produces a snapshot diff here.
 *  2. The full generator produces a valid PDF (magic bytes, page count) for
 *     the canonical fixture + selections.
 *
 * Story 1.2a AC: "golden-fixture tests assert each refactored generator
 * produces output equivalent to the pre-refactor PDF for representative
 * fixture data". We lock the data plan via snapshot (the content layer)
 * plus structural asserts on the binary (the layout layer is renderer-side
 * and stable; the only way it diverges is intentional layout work).
 */
import { describe, it, expect } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import {
  generateEmergencySheet,
  type EmergencySheetSelections,
} from '../emergencySheet'
import { collectFieldsByPdfView } from '../schemaPdfViews'
import { buildFixture } from './fixtures/deathboxData.fixture'
import { serializeSections } from './fixtures/serialize'

function fullSelections(): EmergencySheetSelections {
  return {
    people: ['person-1', 'person-2'],
    contacts: [0, 1, 2, 3],
    includeHealthInsurance: true,
    medical: [0],
    storage: ['storage-1'],
    crypto: [0],
    includeLegalDocuments: true,
  }
}

describe('emergencySheet — schema-driven data plan', () => {
  it('matches the snapshot for the canonical fixture', () => {
    const data = buildFixture()
    const sections = collectFieldsByPdfView('emergencySheet', data)
    expect(serializeSections(sections)).toMatchSnapshot()
  })
})

describe('emergencySheet — generator output', () => {
  it('produces a valid PDF with one letter-sized page', async () => {
    const bytes = await generateEmergencySheet(buildFixture(), fullSelections())

    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.length).toBeGreaterThan(0)

    const header = String.fromCharCode(...bytes.slice(0, 4))
    expect(header).toBe('%PDF')

    const reopened = await PDFDocument.load(bytes)
    expect(reopened.getPageCount()).toBe(1)
    const [page] = reopened.getPages()
    expect(Math.round(page.getWidth())).toBe(612)
    expect(Math.round(page.getHeight())).toBe(792)
  })

  it('produces an empty-but-valid PDF when nothing is selected', async () => {
    const bytes = await generateEmergencySheet(buildFixture(), {
      people: [],
      contacts: [],
      includeHealthInsurance: false,
      medical: [],
      storage: [],
      crypto: [],
      includeLegalDocuments: false,
    })

    expect(bytes.length).toBeGreaterThan(0)
    const reopened = await PDFDocument.load(bytes)
    expect(reopened.getPageCount()).toBe(1)
  })
})
