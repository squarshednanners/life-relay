import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { DeathboxData } from '@/models/DeathboxData'
import { drawLifeRelayMark, drawGeneratedBy } from './pdfBranding'

export interface EmergencySheetSelections {
  people: string[]
  contacts: number[]
  includeHealthInsurance: boolean
  medical: number[]
  storage: string[]
  crypto: number[]
  includeLegalDocuments: boolean
}

const PAGE_WIDTH = 612
const PAGE_HEIGHT = 792
const MARGIN = 36
const COL_GAP = 16
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN
const COL_WIDTH = (CONTENT_WIDTH - COL_GAP) / 2

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

export async function generateEmergencySheet(
  data: DeathboxData,
  selections: EmergencySheetSelections
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])

  let y = PAGE_HEIGHT - MARGIN

  // --- Header ---
  const headerHeight = 40
  page.drawRectangle({
    x: 0,
    y: y - headerHeight + 15,
    width: PAGE_WIDTH,
    height: headerHeight,
    color: rgb(0.8, 0.15, 0.15),
  })

  const title = 'EMERGENCY INFORMATION SHEET'
  const titleWidth = bold.widthOfTextAtSize(title, 16)
  page.drawText(title, {
    x: (PAGE_WIDTH - titleWidth) / 2,
    y: y - headerHeight + 27,
    size: 16,
    font: bold,
    color: rgb(1, 1, 1),
  })
  y -= headerHeight + 8

  // Date
  const dateStr = sanitize(`Prepared: ${new Date(data.updatedAt || new Date().toISOString()).toLocaleDateString()}`)
  page.drawText(dateStr, {
    x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(dateStr, 7),
    y: y,
    size: 7,
    font,
    color: rgb(0.5, 0.5, 0.5),
  })
  y -= 16

  // --- Helpers ---
  const fontSize = 8
  const labelSize = 7
  const sectionTitleSize = 9
  const lineHeight = 11
  const sectionGap = 6

  function drawSectionTitle(text: string, x: number, colW: number) {
    page.drawRectangle({
      x,
      y: y - 2,
      width: colW,
      height: 14,
      color: rgb(0.93, 0.93, 0.93),
    })
    page.drawText(sanitize(text), {
      x: x + 4,
      y: y + 1,
      size: sectionTitleSize,
      font: bold,
      color: rgb(0.2, 0.2, 0.2),
    })
    y -= 16
  }

  function drawField(label: string, value: string | undefined, x: number, maxW: number): boolean {
    if (!value || value.trim() === '') return false
    const clean = sanitize(truncate(value.trim().replace(/\n/g, ', '), 100))
    const labelText = sanitize(label + ': ')
    const labelW = bold.widthOfTextAtSize(labelText, labelSize)
    page.drawText(labelText, {
      x,
      y,
      size: labelSize,
      font: bold,
      color: rgb(0.4, 0.4, 0.4),
    })
    const valMaxW = maxW - labelW
    const words = clean.split(' ')
    let line = ''
    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(test, fontSize) > valMaxW && line) {
        page.drawText(line, {
          x: x + labelW,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        })
        y -= lineHeight
        line = word
      } else {
        line = test
      }
    }
    if (line) {
      page.drawText(line, {
        x: x + labelW,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      })
    }
    y -= lineHeight
    return true
  }

  // Filter data based on selections
  const selectedPeople = (data.people ?? []).filter(p => selections.people.includes(p.id))
  const allContacts = data.importantContacts ?? []
  const selectedContacts = selections.contacts.map(i => allContacts[i]).filter(Boolean)
  const allMedical = data.medicalInfo ?? []
  const selectedMedical = selections.medical.map(i => allMedical[i]).filter(Boolean)
  const selectedStorage = (data.physicalStorageLocations ?? []).filter(s => selections.storage.includes(s.id))

  // ========================================
  // LEFT COLUMN
  // ========================================
  const leftX = MARGIN
  const savedY = y

  // --- People ---
  if (selectedPeople.length > 0) {
    drawSectionTitle('PERSONAL INFORMATION', leftX, COL_WIDTH)
    for (const person of selectedPeople) {
      if (person.name) {
        page.drawText(sanitize(person.name), {
          x: leftX + 2,
          y,
          size: fontSize + 1,
          font: bold,
          color: rgb(0, 0, 0),
        })
        y -= lineHeight
      }
      drawField('DOB', person.dateOfBirth, leftX + 2, COL_WIDTH - 4)
      drawField('Phone', person.phone, leftX + 2, COL_WIDTH - 4)
      drawField('Address', person.address, leftX + 2, COL_WIDTH - 4)
      y -= 2
    }
    y -= sectionGap
  }

  // --- Key Contacts ---
  if (selectedContacts.length > 0) {
    drawSectionTitle('KEY CONTACTS', leftX, COL_WIDTH)
    const priority = ['Executor', 'Attorney', 'Doctor', 'Family', 'Accountant / CPA', 'Financial Advisor', 'Insurance Agent', 'Trustee', 'Clergy']
    const sorted = [...selectedContacts].sort((a, b) => {
      const ai = priority.indexOf(a.role || '')
      const bi = priority.indexOf(b.role || '')
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })

    for (const contact of sorted) {
      if (y < MARGIN + 30) break
      const nameRole = [contact.name, contact.role].filter(Boolean).join(' - ')
      if (nameRole) {
        page.drawText(sanitize(truncate(nameRole, 60)), {
          x: leftX + 2,
          y,
          size: fontSize,
          font: bold,
          color: rgb(0.15, 0.15, 0.15),
        })
        y -= lineHeight
      }
      drawField('Phone', contact.phone, leftX + 6, COL_WIDTH - 8)
      drawField('Email', contact.email, leftX + 6, COL_WIDTH - 8)
      if (contact.organization) {
        drawField('Org', contact.organization, leftX + 6, COL_WIDTH - 8)
      }
      y -= 2
    }
    y -= sectionGap
  }

  // --- Health Insurance ---
  if (selections.includeHealthInsurance && data.healthInsurance) {
    const policies = Array.isArray(data.healthInsurance) ? data.healthInsurance : [data.healthInsurance]
    const validPolicies = policies.filter((hi: any) => hi.provider || hi.policyNumber || hi.groupNumber || hi.contactPhone)
    if (validPolicies.length > 0) {
      drawSectionTitle('HEALTH INSURANCE', leftX, COL_WIDTH)
      for (const hi of validPolicies) {
        drawField('Provider', [hi.provider, hi.planType].filter(Boolean).join(' — '), leftX + 2, COL_WIDTH - 4)
        drawField('Policy #', hi.policyNumber, leftX + 2, COL_WIDTH - 4)
        drawField('Group #', hi.groupNumber, leftX + 2, COL_WIDTH - 4)
        drawField('Phone', hi.contactPhone, leftX + 2, COL_WIDTH - 4)
        if (hi.coveredMembers) drawField('Covered', hi.coveredMembers, leftX + 2, COL_WIDTH - 4)
        y -= 4
      }
      y -= sectionGap - 4
    }
  }

  const leftColumnBottom = y

  // ========================================
  // RIGHT COLUMN
  // ========================================
  const rightX = MARGIN + COL_WIDTH + COL_GAP
  y = savedY

  // --- Medical Info ---
  if (selectedMedical.length > 0) {
    drawSectionTitle('MEDICAL INFORMATION', rightX, COL_WIDTH)
    for (const med of selectedMedical) {
      if (y < MARGIN + 30) break
      const person = data.people?.find(p => p.id === med.personId)
      if (person?.name) {
        page.drawText(sanitize(person.name), {
          x: rightX + 2,
          y,
          size: fontSize,
          font: bold,
          color: rgb(0.15, 0.15, 0.15),
        })
        y -= lineHeight
      }
      drawField('Physician', med.primaryPhysician, rightX + 6, COL_WIDTH - 8)
      drawField('Dr. Phone', med.physicianPhone, rightX + 6, COL_WIDTH - 8)
      drawField('Allergies', med.allergies, rightX + 6, COL_WIDTH - 8)
      drawField('Medications', med.medications, rightX + 6, COL_WIDTH - 8)
      drawField('Conditions', med.medicalConditions, rightX + 6, COL_WIDTH - 8)
      if (med.organDonor) {
        drawField('Organ Donor', 'Yes', rightX + 6, COL_WIDTH - 8)
      }
      drawField('Advance Directive', med.advanceDirective, rightX + 6, COL_WIDTH - 8)
      y -= 4
    }
    y -= sectionGap
  }

  // --- Key Document Locations ---
  if (selectedStorage.length > 0) {
    drawSectionTitle('KEY DOCUMENT LOCATIONS', rightX, COL_WIDTH)
    for (const loc of selectedStorage) {
      if (y < MARGIN + 30) break
      const label = [loc.name, loc.locationType].filter(Boolean).join(' (') + (loc.locationType ? ')' : '')
      if (label) {
        page.drawText(sanitize(truncate(label, 55)), {
          x: rightX + 2,
          y,
          size: fontSize,
          font: bold,
          color: rgb(0.15, 0.15, 0.15),
        })
        y -= lineHeight
      }
      drawField('Location', loc.location, rightX + 6, COL_WIDTH - 8)
      drawField('Key/Access', loc.keyLocation || loc.accessInstructions, rightX + 6, COL_WIDTH - 8)
      y -= 2
    }
    y -= sectionGap
  }

  // --- Legal Documents ---
  if (selections.includeLegalDocuments && data.legalDocuments) {
    const ld = data.legalDocuments
    const hasData = ld.willLocation || ld.powerOfAttorney || ld.livingWill || ld.poaAgent
    if (hasData) {
      drawSectionTitle('LEGAL DOCUMENTS', rightX, COL_WIDTH)
      drawField('Will Location', ld.willLocation, rightX + 2, COL_WIDTH - 4)
      drawField('Will Date', ld.willDate, rightX + 2, COL_WIDTH - 4)
      drawField('POA Agent', ld.poaAgent, rightX + 2, COL_WIDTH - 4)
      drawField('POA Location', ld.powerOfAttorney, rightX + 2, COL_WIDTH - 4)
      drawField('Living Will', ld.livingWill, rightX + 2, COL_WIDTH - 4)
      y -= sectionGap
    }
  }

  // --- Crypto Assets ---
  const allCrypto = data.cryptoAssets ?? []
  const selectedCrypto = (selections.crypto ?? []).map(i => allCrypto[i]).filter(Boolean)
  if (selectedCrypto.length > 0 && y > MARGIN + 50) {
    drawSectionTitle('CRYPTOCURRENCY ASSETS', rightX, COL_WIDTH)
    for (const asset of selectedCrypto) {
      if (y < MARGIN + 30) break
      const label = asset.nickname || asset.type || 'Crypto Asset'
      const chain = asset.blockchain && asset.blockchain !== 'Other'
        ? asset.blockchain
        : asset.blockchainOther || ''
      const nameChain = [label, chain].filter(Boolean).join(' — ')
      page.drawText(sanitize(truncate(nameChain, 55)), {
        x: rightX + 2,
        y,
        size: fontSize,
        font: bold,
        color: rgb(0.15, 0.15, 0.15),
      })
      y -= lineHeight
      const storageLabels: Record<string, string> = {
        'single-sig': 'Single-Sig Wallet',
        'multi-sig': 'Multi-Sig Wallet',
        'exchange': 'Exchange',
      }
      drawField('Type', storageLabels[asset.storageType || ''] || asset.storageType, rightX + 6, COL_WIDTH - 8)
      drawField('Holdings', asset.approximateHoldings, rightX + 6, COL_WIDTH - 8)
      if (asset.storageType === 'exchange') {
        drawField('Exchange', asset.exchange, rightX + 6, COL_WIDTH - 8)
      } else {
        const walletName = asset.walletApp === 'Other' ? asset.walletAppOther : asset.walletApp
        drawField('Wallet', walletName, rightX + 6, COL_WIDTH - 8)
        // Show first key location hint if available
        const firstKey = asset.singleKey?.[0] || asset.multiSigConfig?.keys?.[0]
        const firstLoc = firstKey?.physicalKeyLocations?.[0]
        if (firstLoc?.location) {
          drawField('Key Location', firstLoc.location, rightX + 6, COL_WIDTH - 8)
        }
      }
      y -= 2
    }
    y -= sectionGap
  }

  const rightColumnBottom = y

  // ========================================
  // FOOTER
  // ========================================
  y = Math.min(leftColumnBottom, rightColumnBottom) - 6

  if (y > MARGIN + 30) {
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    })
    y -= 12

    const footer = 'This is a summary sheet only. See the full Life Relay document for complete information.'
    const footerW = font.widthOfTextAtSize(footer, 7)
    page.drawText(footer, {
      x: (PAGE_WIDTH - footerW) / 2,
      y,
      size: 7,
      font,
      color: rgb(0.5, 0.5, 0.5),
    })
    y -= 14
    drawGeneratedBy(page, font, PAGE_WIDTH, y)
  }

  // Logo mark in bottom-left corner
  drawLifeRelayMark(page, MARGIN, MARGIN + 10, 18)

  return pdfDoc.save()
}
