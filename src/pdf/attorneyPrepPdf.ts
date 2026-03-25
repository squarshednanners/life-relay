import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { DeathboxData } from '@/models/DeathboxData'
import { estatePrepCategories, attorneyMeetingChecklist } from '@/data/willPrepCategories'
import { ESTATE_PREP_DISCLAIMER, ESTATE_PREP_PDF_FOOTER } from '@/data/willPrepDisclaimers'
import { hasSectionData } from '@/composables/useSectionProgress'
import { drawLifeRelayMark, drawGeneratedBy } from './pdfBranding'

const PAGE_WIDTH = 612
const PAGE_HEIGHT = 792
const MARGIN = 50
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN

function sanitize(text: string): string {
  return text
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, '--')
    .replace(/\u2013/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u2192/g, '->')
    .replace(/\u2190/g, '<-')
    .replace(/[^\x20-\x7E\n\r\t]/g, '?')
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen - 3) + '...'
}

export async function generateAttorneyPrepPdf(data: DeathboxData): Promise<Uint8Array> {
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
    // Footer text
    const footerW = font.widthOfTextAtSize(ESTATE_PREP_PDF_FOOTER, 7)
    page.drawText(ESTATE_PREP_PDF_FOOTER, {
      x: (PAGE_WIDTH - footerW) / 2,
      y: 25,
      size: 7,
      font: italic,
      color: rgb(0.5, 0.5, 0.5),
    })
    // Page number
    const pNum = `Page ${pageCount}`
    page.drawText(pNum, {
      x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(pNum, 7),
      y: 25,
      size: 7,
      font,
      color: rgb(0.5, 0.5, 0.5),
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

  function drawField(label: string, value: string | undefined | null, indent = 0): boolean {
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
      color: rgb(0.4, 0.4, 0.4),
    })
    // Word-wrap the value
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
          color: rgb(0, 0, 0),
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
        color: rgb(0, 0, 0),
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
      color: rgb(0.93, 0.93, 0.95),
    })
    page.drawText(sanitize(text.toUpperCase()), {
      x: MARGIN + 6,
      y: y + 1,
      size: 10,
      font: bold,
      color: rgb(0.2, 0.2, 0.3),
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
      color: rgb(0.1, 0.1, 0.1),
    })
    y -= lineHeight + 2
  }

  // ========================================
  // TITLE PAGE
  // ========================================
  y -= 60
  const title = 'Estate Planning — Attorney Preparation Summary'
  const titleW = bold.widthOfTextAtSize(title, 18)
  // Logo mark next to title
  const logoSize = 22
  const titleBlockWidth = logoSize + 8 + titleW
  const titleBlockX = (PAGE_WIDTH - titleBlockWidth) / 2
  drawLifeRelayMark(page, titleBlockX, y + 16, logoSize)
  page.drawText(title, {
    x: titleBlockX + logoSize + 8,
    y,
    size: 18,
    font: bold,
    color: rgb(0.06, 0.46, 0.43),
  })
  y -= 24

  const subtitle = 'Prepared from Life Relay'
  const subW = font.widthOfTextAtSize(subtitle, 12)
  page.drawText(subtitle, {
    x: (PAGE_WIDTH - subW) / 2,
    y,
    size: 12,
    font,
    color: rgb(0.4, 0.4, 0.4),
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
    color: rgb(0.5, 0.5, 0.5),
  })
  y -= 30

  // Disclaimer box on title page
  page.drawRectangle({
    x: MARGIN,
    y: y - 50,
    width: CONTENT_WIDTH,
    height: 55,
    color: rgb(1, 0.97, 0.9),
    borderColor: rgb(0.85, 0.7, 0.3),
    borderWidth: 1,
  })
  // Wrap disclaimer text
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
        color: rgb(0.5, 0.4, 0.1),
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
      color: rgb(0.5, 0.4, 0.1),
    })
  }
  y -= 70

  // Readiness summary
  const completedSections = estatePrepCategories
    .flatMap(c => c.sections)
    .filter(s => hasSectionData(data, s.path))
  const totalSections = estatePrepCategories.flatMap(c => c.sections).length
  drawField('Sections Completed', `${completedSections.length} of ${totalSections}`)
  y -= 8

  // Category readiness
  for (const cat of estatePrepCategories) {
    const done = cat.sections.filter(s => hasSectionData(data, s.path)).length
    const status = done === cat.sections.length ? 'Complete' : `${done}/${cat.sections.length}`
    drawField(cat.title, `${status} (${cat.priority})`, 8)
  }

  // ========================================
  // CONTENT PAGES
  // ========================================
  newPage()

  // --- Identity & Family ---
  const people = data.people ?? []
  if (people.length > 0) {
    drawSectionHeader('Personal Information')
    for (const person of people) {
      if (person.name) drawItemName(person.name)
      drawField('Date of Birth', person.dateOfBirth, 8)
      drawField('SSN', person.socialSecurityNumber, 8)
      drawField('Phone', person.phone, 8)
      drawField('Email', person.email, 8)
      drawField('Address', person.address, 8)
      y -= 4
    }
    y -= 8
  }

  // --- Beneficiaries ---
  const beneficiaries = data.beneficiaries ?? []
  if (beneficiaries.length > 0) {
    drawSectionHeader('Beneficiaries')
    for (const b of beneficiaries) {
      const label = [b.name, b.type ? `(${b.type})` : ''].filter(Boolean).join(' ')
      if (label) drawItemName(label)
      drawField('Relationship', b.relationship, 8)
      drawField('Date of Birth', b.dateOfBirth, 8)
      drawField('Address', b.address, 8)
      drawField('Percentage', b.percentage ? `${b.percentage}%` : undefined, 8)
      drawField('Notes', b.notes, 8)
      y -= 4
    }
    y -= 8
  }

  // --- Executor & Key Contacts ---
  const contacts = data.importantContacts ?? []
  if (contacts.length > 0) {
    drawSectionHeader('Executor & Key Contacts')
    const priority = ['Executor', 'Attorney', 'Trustee', 'Financial Advisor', 'Accountant / CPA', 'Insurance Agent', 'Doctor', 'Clergy']
    const sorted = [...contacts].sort((a, b) => {
      const ai = priority.indexOf(a.role || '')
      const bi = priority.indexOf(b.role || '')
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })
    for (const c of sorted) {
      const nameRole = [c.name, c.role].filter(Boolean).join(' — ')
      if (nameRole) drawItemName(nameRole)
      drawField('Phone', c.phone, 8)
      drawField('Email', c.email, 8)
      drawField('Organization', c.organization, 8)
      drawField('Notes', c.notes, 8)
      y -= 4
    }
    y -= 8
  }

  // --- Financial Accounts ---
  const accounts = (data.financialAccounts ?? []) as any[]
  if (accounts.length > 0) {
    drawSectionHeader('Financial Accounts')
    for (const a of accounts) {
      const label = [a.institution, a.accountType].filter(Boolean).join(' — ')
      if (label) drawItemName(label)
      drawField('Account #', a.accountNumber, 8)
      drawField('Balance', a.balance, 8)
      drawField('Owner', a.accountCategory, 8)
      y -= 4
    }
    y -= 8
  }

  // --- Property ---
  const properties = data.property ?? []
  if (properties.length > 0) {
    drawSectionHeader('Property & Real Estate')
    for (const p of properties) {
      const label = p.address || 'Property'
      drawItemName(label)
      drawField('Type', p.type, 8)
      drawField('Ownership', p.ownership, 8)
      drawField('Estimated Value', p.estimatedValue, 8)
      drawField('Mortgage Info', p.mortgageInfo, 8)
      y -= 4
    }
    y -= 8
  }

  // --- Vehicles ---
  const vehicles = data.vehicles ?? []
  if (vehicles.length > 0) {
    drawSectionHeader('Vehicles')
    for (const v of vehicles) {
      const label = [v.year, v.make, v.model].filter(Boolean).join(' ')
      drawItemName(label || 'Vehicle')
      drawField('VIN', v.vin, 8)
      drawField('Title Location', v.titleLocation, 8)
      drawField('Lienholder', v.lienholder, 8)
      y -= 4
    }
    y -= 8
  }

  // --- Retirement & Investment ---
  const retirement = data.retirementAccounts ?? []
  if (retirement.length > 0) {
    drawSectionHeader('Retirement & Investment Accounts')
    for (const r of retirement) {
      const label = [r.institution, r.type].filter(Boolean).join(' — ')
      drawItemName(label || 'Account')
      drawField('Account #', r.accountNumber, 8)
      drawField('Balance', r.balance, 8)
      if (r.beneficiaries?.length) {
        const bNames = r.beneficiaries.map((b: any) => b.customName || 'Designated').join(', ')
        drawField('Beneficiaries', bNames, 8)
      }
      y -= 4
    }
    y -= 8
  }

  // --- Crypto Assets (non-sensitive) ---
  const crypto = data.cryptoAssets ?? []
  if (crypto.length > 0) {
    drawSectionHeader('Cryptocurrency Assets')
    for (const c of crypto) {
      const chain = c.blockchain && c.blockchain !== 'Other' ? c.blockchain : c.blockchainOther || ''
      const label = [c.nickname || c.type, chain].filter(Boolean).join(' — ')
      drawItemName(label || 'Crypto Asset')
      const storageLabels: Record<string, string> = {
        'single-sig': 'Single-Sig Wallet',
        'multi-sig': 'Multi-Sig Wallet',
        'exchange': 'Exchange',
      }
      drawField('Storage', storageLabels[c.storageType || ''] || c.storageType, 8)
      drawField('Holdings', c.approximateHoldings, 8)
      if (c.storageType === 'exchange') {
        drawField('Exchange', c.exchange, 8)
      } else {
        const walletName = c.walletApp === 'Other' ? c.walletAppOther : c.walletApp
        drawField('Wallet App', walletName, 8)
      }
      y -= 4
    }
    y -= 8
  }

  // --- Debts ---
  const debts = data.debts ?? []
  if (debts.length > 0) {
    drawSectionHeader('Debts & Obligations')
    for (const d of debts) {
      const label = [d.creditor, d.type].filter(Boolean).join(' — ')
      drawItemName(label || 'Debt')
      drawField('Account #', d.accountNumber, 8)
      drawField('Balance', d.balance, 8)
      drawField('Monthly Payment', d.monthlyPayment, 8)
      y -= 4
    }
    y -= 8
  }

  // --- Credit Cards ---
  const cards = data.creditCards ?? []
  if (cards.length > 0) {
    drawSectionHeader('Credit Cards')
    for (const c of cards) {
      drawItemName(c.cardName || c.issuer || 'Credit Card')
      drawField('Card #', c.cardNumber, 8)
      drawField('Issuer', c.issuer, 8)
      y -= 4
    }
    y -= 8
  }

  // --- Life Insurance ---
  const policies = data.lifeInsurance?.policies ?? []
  if (policies.length > 0) {
    drawSectionHeader('Life Insurance Policies')
    for (const p of policies) {
      drawItemName(p.company || 'Policy')
      drawField('Policy #', p.policyNumber, 8)
      drawField('Amount', p.amount, 8)
      if (p.beneficiaries?.length) {
        const bNames = p.beneficiaries.map((b: any) => b.customName || 'Designated').join(', ')
        drawField('Beneficiaries', bNames, 8)
      }
      y -= 4
    }
    y -= 8
  }

  // --- Legal Documents ---
  if (data.legalDocuments) {
    const ld = data.legalDocuments
    const hasData = ld.willLocation || ld.willDate || ld.poaAgent || ld.powerOfAttorney || ld.livingWill
    if (hasData) {
      drawSectionHeader('Existing Legal Documents')
      drawField('Will Location', ld.willLocation, 4)
      drawField('Will Date', ld.willDate, 4)
      drawField('POA Agent', ld.poaAgent, 4)
      drawField('POA Document Location', ld.powerOfAttorney, 4)
      drawField('Living Will / Advance Directive', ld.livingWill, 4)
      drawField('Other Documents', ld.otherDocuments, 4)
      y -= 8
    }
  }

  // --- Trusts ---
  const trusts = data.trusts ?? []
  if (trusts.length > 0) {
    drawSectionHeader('Trusts')
    for (const t of trusts) {
      drawItemName(t.trustName || t.trustType || 'Trust')
      drawField('Type', t.trustType, 8)
      drawField('Date Created', t.dateCreated, 8)
      drawField('Trustee', t.trustee, 8)
      drawField('Successor Trustee', t.successorTrustee, 8)
      y -= 4
    }
    y -= 8
  }

  // --- Trust Planning Considerations ---
  // This section summarizes assets that may be candidates for trust funding
  const businesses = data.businessOwnership ?? []
  const trustFundingCandidates: string[] = []
  if (properties.length > 0) trustFundingCandidates.push(`${properties.length} propert${properties.length === 1 ? 'y' : 'ies'}`)
  if (accounts.length > 0) trustFundingCandidates.push(`${accounts.length} financial account${accounts.length === 1 ? '' : 's'}`)
  if (retirement.length > 0) trustFundingCandidates.push(`${retirement.length} retirement account${retirement.length === 1 ? '' : 's'}`)
  if (crypto.length > 0) trustFundingCandidates.push(`${crypto.length} crypto asset${crypto.length === 1 ? '' : 's'}`)
  if (businesses.length > 0) trustFundingCandidates.push(`${businesses.length} business interest${businesses.length === 1 ? '' : 's'}`)

  if (trustFundingCandidates.length > 0 || trusts.length > 0) {
    drawSectionHeader('Trust Planning Considerations')

    if (trusts.length > 0) {
      drawField('Existing Trusts', `${trusts.length} trust${trusts.length === 1 ? '' : 's'} already established (see above)`, 4)
    }

    if (trustFundingCandidates.length > 0) {
      drawField('Assets for Potential Trust Funding', trustFundingCandidates.join(', '), 4)
    }

    // Highlight beneficiaries who might need special trust provisions
    const minorBeneficiaries = beneficiaries.filter(b => {
      if (!b.dateOfBirth) return false
      const age = Math.floor((Date.now() - new Date(b.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      return age < 18
    })
    if (minorBeneficiaries.length > 0) {
      const names = minorBeneficiaries.map((b: any) => b.name || 'Unnamed').join(', ')
      drawField('Minor Beneficiaries (may need trust)', names, 4)
    }

    // Note about life insurance trust
    if (policies.length > 0) {
      const totalAmount = policies
        .map((p: any) => p.amount)
        .filter(Boolean)
        .join(', ')
      if (totalAmount) {
        drawField('Life Insurance (ILIT candidate)', `${policies.length} polic${policies.length === 1 ? 'y' : 'ies'} — amounts: ${totalAmount}`, 4)
      }
    }

    y -= 8
  }

  // --- Business Ownership ---
  if (businesses.length > 0) {
    drawSectionHeader('Business Ownership')
    for (const b of businesses) {
      drawItemName(b.businessName || 'Business')
      drawField('Type', b.type, 8)
      drawField('Ownership %', b.ownershipPercentage ? `${b.ownershipPercentage}%` : undefined, 8)
      drawField('Contact Info', b.contactInfo, 8)
      y -= 4
    }
    y -= 8
  }

  // ========================================
  // ATTORNEY MEETING CHECKLIST
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
      color: rgb(0.2, 0.2, 0.2),
    })
    y -= lineHeight + 2
    for (const item of group.items) {
      ensureSpace(lineHeight + 2)
      page.drawText(sanitize(`[ ]  ${item}`), {
        x: MARGIN + 12,
        y,
        size: fontSize,
        font,
        color: rgb(0.3, 0.3, 0.3),
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
