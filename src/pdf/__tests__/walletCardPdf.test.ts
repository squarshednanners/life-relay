/**
 * Golden-fixture tests for the wallet-card thin renderer.
 *
 * Three assertion layers:
 *  1. Schema-driven data plan — `collectFieldsByPdfView('walletCard')` snapshot.
 *  2. Cross-section join — `gatherCardData(fixture)` snapshot. Locks in the
 *     owner / medical-by-personId / contact-then-beneficiary-fallback logic
 *     that the schema tags alone can't express.
 *  3. Generator output — valid PDF with the expected 2x4 card grid layout.
 */
import { describe, it, expect } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import {
  generateWalletCardPdf,
  gatherCardData,
} from '../walletCardPdf'
import { collectFieldsByPdfView } from '../schemaPdfViews'
import { buildFixture } from './fixtures/deathboxData.fixture'
import { serializeSections } from './fixtures/serialize'

describe('walletCardPdf — schema-driven data plan', () => {
  it('matches the snapshot for the canonical fixture', () => {
    const sections = collectFieldsByPdfView('walletCard', buildFixture())
    expect(serializeSections(sections)).toMatchSnapshot()
  })
})

describe('walletCardPdf — gatherCardData cross-section join', () => {
  it('matches the snapshot for the canonical fixture', () => {
    expect(gatherCardData(buildFixture())).toMatchSnapshot()
  })

  it('falls back to beneficiaries when fewer than 4 contacts are tagged', () => {
    const data = buildFixture()
    // Drop important contacts down to one so the beneficiary fallback fires.
    data.importantContacts = [data.importantContacts![0]]
    // Add a phone to the secondary beneficiary so it qualifies for the fallback.
    data.beneficiaries![1].phone = '(555) 030-9090'

    const card = gatherCardData(data)
    expect(card.contacts.length).toBeGreaterThan(1)
    expect(card.contacts.some((c) => c.label === 'Beneficiary')).toBe(true)
  })

  it('resolves bloodType via the medicalInfo notes-regex formatter', () => {
    const card = gatherCardData(buildFixture())
    expect(card.bloodType).toBe('A+')
  })

  it('matches the medicalInfo entry whose personId equals the owner (people[0]) id', () => {
    const data = buildFixture()
    // Add a second medical record that should NOT be picked.
    data.medicalInfo!.push({
      personId: 'person-2',
      allergies: 'Latex',
      notes: 'Blood Type: O-',
    })
    const card = gatherCardData(data)
    // Owner is person-1 (Eleanor) — still picks her A+ record, not Thomas's O-.
    expect(card.bloodType).toBe('A+')
    expect(card.allergies).toContain('Penicillin')
  })
})

describe('walletCardPdf — generator output', () => {
  it('produces a valid PDF with one letter-sized page', async () => {
    const bytes = await generateWalletCardPdf(buildFixture())

    expect(bytes).toBeInstanceOf(Uint8Array)
    const header = String.fromCharCode(...bytes.slice(0, 4))
    expect(header).toBe('%PDF')

    const reopened = await PDFDocument.load(bytes)
    expect(reopened.getPageCount()).toBe(1)
    const [page] = reopened.getPages()
    expect(Math.round(page.getWidth())).toBe(612)
    expect(Math.round(page.getHeight())).toBe(792)
  })
})
