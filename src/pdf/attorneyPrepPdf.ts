/**
 * Attorney Prep Packet PDF — thin renderer driven by schema-tagged
 * `pdfViews.attorneyPrep` metadata.
 *
 * Schema-as-truth: each section (Personal Information, Beneficiaries,
 * Executor & Key Contacts, Financial Accounts, Property, Vehicles,
 * Retirement & Investment Accounts, Cryptocurrency Assets, Debts,
 * Credit Cards, Life Insurance Policies, Existing Legal Documents, Trusts,
 * Business Ownership) flows from `pdfViews.attorneyPrep` schema tags.
 *
 * Renderer-side concerns kept here:
 *   - Title page + disclaimer box
 *   - Readiness summary (uses hasSectionData helper across estatePrepCategories)
 *   - Trust Planning Considerations — bespoke aggregation logic counting items
 *     across sections + computing minor beneficiaries from age
 *   - Attorney Meeting Checklist (curated content from willPrepCategories)
 *   - Section ordering on the page (config below)
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { DeathboxData } from '@/models/DeathboxData'
import { estatePrepCategories, attorneyMeetingChecklist } from '@/data/willPrepCategories'
import { ESTATE_PREP_DISCLAIMER, ESTATE_PREP_PDF_FOOTER } from '@/data/willPrepDisclaimers'
import { hasSectionData } from '@/composables/useSectionProgress'
import { drawLifeRelayMark, drawGeneratedBy } from './pdfBranding'
import {
  collectFieldsByPdfView,
  type CollectedSection,
} from './schemaPdfViews'
import { pdfColor } from '@/tokens'

const PAGE_WIDTH = 612
const PAGE_HEIGHT = 792
const MARGIN = 50
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN

/**
 * Section order in the rendered packet. Sections not listed do not appear
 * even if schema-tagged. Order matches the original generator.
 */
const SECTION_ORDER: string[] = [
  'people',
  'beneficiaries',
  'importantContacts',
  'financialAccounts',
  'property',
  'vehicles',
  'retirementAccounts',
  'cryptoAssets',
  'debts',
  'creditCards',
  'lifeInsurance.policies',
  'legalDocuments',
  'trusts',
  // Trust Planning Considerations (bespoke; rendered separately after trusts)
  'businessOwnership',
]

function sanitize(text: string): string {
  return text
    .replace(/[‘’′]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/—/g, '--')
    .replace(/–/g, '-')
    .replace(/…/g, '...')
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/[^\x20-\x7E\n\r\t]/g, '?')
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen - 3) + '...'
}

export async function generateAttorneyPrepPdf(
  data: DeathboxData,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = PAGE_HEIGHT - MARGIN

  const fontSize = 9
  const labelSize = 8
  const lineHeight = 13

  function addFooter() {
    const pageCount = pdfDoc.getPageCount()
    const footerW = font.widthOfTextAtSize(ESTATE_PREP_PDF_FOOTER, 7)
    page.drawText(ESTATE_PREP_PDF_FOOTER, {
      x: (PAGE_WIDTH - footerW) / 2,
      y: 25,
      size: 7,
      font: italic,
      color: rgb(...pdfColor.textMuted),
    })
    const pNum = `Page ${pageCount}`
    page.drawText(pNum, {
      x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(pNum, 7),
      y: 25,
      size: 7,
      font,
      color: rgb(...pdfColor.textMuted),
    })
  }

  function newPage() {
    addFooter()
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    y = PAGE_HEIGHT - MARGIN
  }

  function ensureSpace(needed: number) {
    if (y < MARGIN + needed) {
      newPage()
    }
  }

  function drawField(
    label: string,
    value: string | undefined | null,
    indent = 0,
  ): boolean {
    if (!value || value.trim() === '') return false
    ensureSpace(lineHeight + 4)
    const clean = sanitize(truncate(value.trim().replace(/\n/g, ', '), 120))
    const labelText = sanitize(label + ': ')
    const labelW = bold.widthOfTextAtSize(labelText, labelSize)
    page.drawText(labelText, {
      x: MARGIN + indent,
      y,
      size: labelSize,
      font: bold,
      color: rgb(...pdfColor.textLabel),
    })
    const maxW = CONTENT_WIDTH - indent - labelW
    const words = clean.split(' ')
    let line = ''
    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(test, fontSize) > maxW && line) {
        page.drawText(line, {
          x: MARGIN + indent + labelW,
          y,
          size: fontSize,
          font,
          color: rgb(...pdfColor.black),
        })
        y -= lineHeight
        ensureSpace(lineHeight)
        line = word
      } else {
        line = test
      }
    }
    if (line) {
      page.drawText(line, {
        x: MARGIN + indent + labelW,
        y,
        size: fontSize,
        font,
        color: rgb(...pdfColor.black),
      })
    }
    y -= lineHeight
    return true
  }

  function drawSectionHeader(text: string) {
    ensureSpace(30)
    page.drawRectangle({
      x: MARGIN,
      y: y - 3,
      width: CONTENT_WIDTH,
      height: 18,
      color: rgb(...pdfColor.bgSectionHeader),
    })
    page.drawText(sanitize(text.toUpperCase()), {
      x: MARGIN + 6,
      y: y + 1,
      size: 10,
      font: bold,
      color: rgb(...pdfColor.sectionHeaderText),
    })
    y -= 24
  }

  function drawItemName(text: string) {
    ensureSpace(lineHeight + 4)
    page.drawText(sanitize(truncate(text, 80)), {
      x: MARGIN + 4,
      y,
      size: fontSize + 1,
      font: bold,
      color: rgb(...pdfColor.textHeavy),
    })
    y -= lineHeight + 2
  }

  /**
   * Draw all collected items + their fields for a section.
   * The section header is drawn here; items have their itemLabel as bold
   * heading and fields as label/value rows indented 8.
   */
  function drawCollectedSection(section: CollectedSection) {
    if (section.items.length === 0) return
    drawSectionHeader(section.sectionLabel)
    for (const item of section.items) {
      if (item.itemLabel && item.itemLabel.trim() !== '') {
        drawItemName(item.itemLabel)
      }
      for (const field of item.fields) {
        if (field.manualEntryBlank) {
          drawField(field.label, '____________________', 8)
        } else {
          drawField(field.label, field.value, 8)
        }
      }
      y -= 4
    }
    y -= 8
  }

  // ========================================
  // TITLE PAGE
  // ========================================
  y -= 60
  const title = 'Estate Planning — Attorney Preparation Summary'
  const titleW = bold.widthOfTextAtSize(title, 18)
  const logoSize = 22
  const titleBlockWidth = logoSize + 8 + titleW
  const titleBlockX = (PAGE_WIDTH - titleBlockWidth) / 2
  drawLifeRelayMark(page, titleBlockX, y + 16, logoSize)
  page.drawText(title, {
    x: titleBlockX + logoSize + 8,
    y,
    size: 18,
    font: bold,
    color: rgb(...pdfColor.brandTeal),
  })
  y -= 24

  const subtitle = 'Prepared from Life Relay'
  const subW = font.widthOfTextAtSize(subtitle, 12)
  page.drawText(subtitle, {
    x: (PAGE_WIDTH - subW) / 2,
    y,
    size: 12,
    font,
    color: rgb(...pdfColor.textLabel),
  })
  y -= 16

  const dateStr = new Date(data.updatedAt || new Date().toISOString()).toLocaleDateString()
  const dateText = `Last Updated: ${dateStr}`
  const dateW = font.widthOfTextAtSize(dateText, 10)
  page.drawText(dateText, {
    x: (PAGE_WIDTH - dateW) / 2,
    y,
    size: 10,
    font,
    color: rgb(...pdfColor.textMuted),
  })
  y -= 30

  // Disclaimer box
  page.drawRectangle({
    x: MARGIN,
    y: y - 50,
    width: CONTENT_WIDTH,
    height: 55,
    color: rgb(...pdfColor.bgDisclaimerCream),
    borderColor: rgb(...pdfColor.amberBorder),
    borderWidth: 1,
  })
  const disclaimerWords = ESTATE_PREP_DISCLAIMER.split(' ')
  let dLine = ''
  let dY = y - 10
  for (const word of disclaimerWords) {
    const test = dLine ? `${dLine} ${word}` : word
    if (italic.widthOfTextAtSize(test, 8) > CONTENT_WIDTH - 20) {
      page.drawText(dLine, {
        x: MARGIN + 10,
        y: dY,
        size: 8,
        font: italic,
        color: rgb(...pdfColor.amberText),
      })
      dY -= 11
      dLine = word
    } else {
      dLine = test
    }
  }
  if (dLine) {
    page.drawText(dLine, {
      x: MARGIN + 10,
      y: dY,
      size: 8,
      font: italic,
      color: rgb(...pdfColor.amberText),
    })
  }
  y -= 70

  // Readiness summary
  const completedSections = estatePrepCategories
    .flatMap((c) => c.sections)
    .filter((s) => hasSectionData(data, s.path))
  const totalSections = estatePrepCategories.flatMap((c) => c.sections).length
  drawField(
    'Sections Completed',
    `${completedSections.length} of ${totalSections}`,
  )
  y -= 8

  // Category readiness
  for (const cat of estatePrepCategories) {
    const done = cat.sections.filter((s) => hasSectionData(data, s.path)).length
    const status = done === cat.sections.length ? 'Complete' : `${done}/${cat.sections.length}`
    drawField(cat.title, `${status} (${cat.priority})`, 8)
  }

  // ========================================
  // CONTENT PAGES — schema-driven via collectFieldsByPdfView
  // ========================================
  newPage()

  const allCollected = collectFieldsByPdfView('attorneyPrep', data)
  const sectionByKey = new Map(allCollected.map((s) => [s.sectionKey, s]))

  for (const sectionKey of SECTION_ORDER) {
    const section = sectionByKey.get(sectionKey)
    if (!section) continue
    drawCollectedSection(section)
  }

  // ========================================
  // TRUST PLANNING CONSIDERATIONS — bespoke aggregation
  // (counts assets across sections + flags minor beneficiaries by age)
  // ========================================
  const properties = data.property ?? []
  const accounts = (data.financialAccounts ?? []) as unknown[]
  const retirement = data.retirementAccounts ?? []
  const crypto = data.cryptoAssets ?? []
  const businesses = data.businessOwnership ?? []
  const policies = data.lifeInsurance?.policies ?? []
  const beneficiaries = data.beneficiaries ?? []
  const trusts = data.trusts ?? []

  const trustFundingCandidates: string[] = []
  if (properties.length > 0) trustFundingCandidates.push(`${properties.length} propert${properties.length === 1 ? 'y' : 'ies'}`)
  if (accounts.length > 0) trustFundingCandidates.push(`${accounts.length} financial account${accounts.length === 1 ? '' : 's'}`)
  if (retirement.length > 0) trustFundingCandidates.push(`${retirement.length} retirement account${retirement.length === 1 ? '' : 's'}`)
  if (crypto.length > 0) trustFundingCandidates.push(`${crypto.length} crypto asset${crypto.length === 1 ? '' : 's'}`)
  if (businesses.length > 0) trustFundingCandidates.push(`${businesses.length} business interest${businesses.length === 1 ? '' : 's'}`)

  if (trustFundingCandidates.length > 0 || trusts.length > 0) {
    drawSectionHeader('Trust Planning Considerations')

    if (trusts.length > 0) {
      drawField(
        'Existing Trusts',
        `${trusts.length} trust${trusts.length === 1 ? '' : 's'} already established (see above)`,
        4,
      )
    }
    if (trustFundingCandidates.length > 0) {
      drawField(
        'Assets for Potential Trust Funding',
        trustFundingCandidates.join(', '),
        4,
      )
    }

    const minorBeneficiaries = beneficiaries.filter((b) => {
      const dob = (b as Record<string, unknown>).dateOfBirth
      if (typeof dob !== 'string' || !dob) return false
      const age = Math.floor(
        (Date.now() - new Date(dob).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000),
      )
      return age < 18
    })
    if (minorBeneficiaries.length > 0) {
      const names = minorBeneficiaries
        .map((b) => String((b as Record<string, unknown>).name ?? '') || 'Unnamed')
        .join(', ')
      drawField('Minor Beneficiaries (may need trust)', names, 4)
    }

    if (policies.length > 0) {
      const totalAmount = policies
        .map((p) => (p as Record<string, unknown>).amount)
        .filter(Boolean)
        .join(', ')
      if (totalAmount) {
        drawField(
          'Life Insurance (ILIT candidate)',
          `${policies.length} polic${policies.length === 1 ? 'y' : 'ies'} — amounts: ${totalAmount}`,
          4,
        )
      }
    }

    y -= 8
  }

  // ========================================
  // ATTORNEY MEETING CHECKLIST (curated content)
  // ========================================
  ensureSpace(100)
  if (y < PAGE_HEIGHT - MARGIN - 60) {
    newPage()
  }
  drawSectionHeader('Attorney Meeting Checklist')
  for (const group of attorneyMeetingChecklist) {
    ensureSpace(30)
    page.drawText(sanitize(group.category), {
      x: MARGIN + 4,
      y,
      size: fontSize + 1,
      font: bold,
      color: rgb(...pdfColor.textMedium),
    })
    y -= lineHeight + 2
    for (const item of group.items) {
      ensureSpace(lineHeight + 2)
      page.drawText(sanitize(`[ ]  ${item}`), {
        x: MARGIN + 12,
        y,
        size: fontSize,
        font,
        color: rgb(...pdfColor.textChecklist),
      })
      y -= lineHeight
    }
    y -= 6
  }

  // Final footer
  addFooter()

  // "Generated by" on first page
  const firstPage = pdfDoc.getPage(0)
  drawGeneratedBy(firstPage, font, PAGE_WIDTH, 40)

  return pdfDoc.save()
}
