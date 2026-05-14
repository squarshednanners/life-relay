/**
 * Golden-fixture tests for the runbook ("For My Family") PDF thin renderer.
 *
 * Asserts:
 *  1. The schema-driven data plan (`collectFieldsByPdfView('runbookPdf')`) is
 *     stable for the canonical fixture. The runbook only consumes
 *     `importantContacts` from schemas; everything else on its pages is
 *     curated content from `runbookSteps.ts` (which has independent
 *     authoring, not tested here).
 *  2. The full generator produces a valid multi-page PDF.
 */
import { describe, it, expect } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { generateRunbookPdfDocument } from '../runbookPdf'
import { collectFieldsByPdfView } from '../schemaPdfViews'
import { buildFixture } from './fixtures/deathboxData.fixture'
import { serializeSections } from './fixtures/serialize'

describe('runbookPdf — schema-driven data plan', () => {
  it('matches the snapshot for the canonical fixture', () => {
    const sections = collectFieldsByPdfView('runbookPdf', buildFixture())
    expect(serializeSections(sections)).toMatchSnapshot()
  })

  it('contacts are sorted by the schema-declared role priority', () => {
    const sections = collectFieldsByPdfView('runbookPdf', buildFixture())
    const contacts = sections.find((s) => s.sectionKey === 'importantContacts')
    const roles = contacts?.items.map(
      (item) => item.fields.find((f) => f.fieldName === 'role')?.value,
    )
    // Schema declares: Executor, Attorney, Trustee, Doctor, Accountant/CPA, Financial Advisor.
    // Fixture has Executor, Attorney, Doctor, Accountant/CPA — expect that order.
    expect(roles).toEqual(['Executor', 'Attorney', 'Doctor', 'Accountant / CPA'])
  })
})

describe('runbookPdf — generator output', () => {
  it('produces a valid multi-page PDF', async () => {
    const bytes = await generateRunbookPdfDocument(buildFixture())

    expect(bytes).toBeInstanceOf(Uint8Array)
    const header = String.fromCharCode(...bytes.slice(0, 4))
    expect(header).toBe('%PDF')

    const reopened = await PDFDocument.load(bytes)
    // Title page + N phase pages (runbookPhases). Phases are static content,
    // so the count is stable, but we only assert "at least 2" to keep this
    // test resilient to curated-content additions.
    expect(reopened.getPageCount()).toBeGreaterThanOrEqual(2)
    const [page] = reopened.getPages()
    expect(Math.round(page.getWidth())).toBe(612)
    expect(Math.round(page.getHeight())).toBe(792)
  })

  it('produces a valid PDF when no important contacts qualify for Quick Contacts', async () => {
    const data = buildFixture()
    // Strip roles so none match RUNBOOK_PRIORITY_ROLES — the Quick Contacts
    // block must not render, and the rest of the runbook must still produce.
    data.importantContacts = data.importantContacts!.map((c) => ({
      ...c,
      role: 'Friend',
    }))
    const bytes = await generateRunbookPdfDocument(data)
    const reopened = await PDFDocument.load(bytes)
    expect(reopened.getPageCount()).toBeGreaterThanOrEqual(2)
  })
})
