import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { PDFFont } from 'pdf-lib'
import type { DeathboxData } from '@/models/DeathboxData'

/**
 * Generate a credit-card-sized "in case of emergency" card PDF.
 * Layout: US Letter page with 8 cards (2 columns x 4 rows) for easy printing.
 * Each card is roughly the size of a standard credit card (3.375" x 2.125").
 */

const TEAL = rgb(0.06, 0.46, 0.43)
const DARK = rgb(0.15, 0.15, 0.15)
const GRAY = rgb(0.45, 0.45, 0.45)
const WHITE = rgb(1, 1, 1)

const PAGE_W = 612
const PAGE_H = 792
const CARD_W = 243   // 3.375 inch
const CARD_H = 153   // 2.125 inch
const COLS = 2
const ROWS = 4
const H_GAP = 18
const V_GAP = 18
const GRID_W = CARD_W * COLS + H_GAP * (COLS - 1)
const GRID_H = CARD_H * ROWS + V_GAP * (ROWS - 1)
const X_OFFSET = (PAGE_W - GRID_W) / 2
const Y_OFFSET = (PAGE_H - GRID_H) / 2

function sanitize(s: string): string {
  return s
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, '--')
    .replace(/\u2013/g, '-')
    .replace(/[^\x20-\x7E\n\r\t]/g, '?')
}

function truncate(s: string, maxW: number, size: number, font: PDFFont): string {
  let text = sanitize(s)
  while (font.widthOfTextAtSize(text, size) > maxW && text.length > 1) {
    text = text.slice(0, -1)
  }
  if (text !== sanitize(s)) text = text.slice(0, -1) + '...'
  return text
}

interface ContactLine {
  label: string
  name: string
  phone: string
}

function gatherContacts(data: DeathboxData): { owner: string; contacts: ContactLine[]; bloodType: string; allergies: string } {
  const owner = data.people?.[0]?.name || ''
  const medicalInfo = data.medicalInfo?.find((m: any) => m.personId === data.people?.[0]?.id) as any
  const bloodType = medicalInfo?.notes?.match(/blood type:?\s*([A-Z]B?\+?-?)/i)?.[1] || ''
  const allergies = medicalInfo?.allergies || ''

  const contacts = (data.importantContacts as any[]) || []

  // Roles ranked by priority for the wallet card
  const PRIORITY = [
    { label: 'Spouse / Emergency', match: ['spouse', 'emergency contact'] },
    { label: 'Executor', match: ['executor'] },
    { label: 'Attorney', match: ['attorney', 'lawyer'] },
    { label: 'Doctor', match: ['doctor', 'physician'] },
    { label: 'Trustee', match: ['trustee'] },
  ]

  const result: ContactLine[] = []
  for (const slot of PRIORITY) {
    const found = contacts.find(c => c.role && slot.match.some(m => c.role.toLowerCase().includes(m)))
    if (found && (found.phone || found.name)) {
      result.push({
        label: slot.label,
        name: found.name || '',
        phone: found.phone || '',
      })
    }
    if (result.length >= 4) break
  }

  // If we have fewer than 4 contacts, fill with beneficiaries
  if (result.length < 4) {
    const beneficiaries = (data.beneficiaries as any[]) || []
    for (const b of beneficiaries) {
      if (result.length >= 4) break
      if (b.phone) {
        result.push({ label: 'Beneficiary', name: b.name || '', phone: b.phone })
      }
    }
  }

  return { owner, contacts: result, bloodType, allergies }
}

function drawCard(
  page: any, x: number, y: number,
  info: { owner: string; contacts: ContactLine[]; bloodType: string; allergies: string },
  font: PDFFont, bold: PDFFont,
) {
  // Card background
  page.drawRectangle({
    x, y, width: CARD_W, height: CARD_H,
    color: WHITE,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 0.5,
  })

  // Top teal banner
  page.drawRectangle({
    x, y: y + CARD_H - 22, width: CARD_W, height: 22, color: TEAL,
  })
  page.drawText('In Case of Emergency', {
    x: x + 8, y: y + CARD_H - 15, size: 9, font: bold, color: WHITE,
  })
  page.drawText('Life Relay', {
    x: x + CARD_W - bold.widthOfTextAtSize('Life Relay', 8) - 8,
    y: y + CARD_H - 14, size: 8, font: bold, color: WHITE,
  })

  let cy = y + CARD_H - 32

  // Owner name
  if (info.owner) {
    const ownerTxt = truncate(info.owner, CARD_W - 16, 9, bold)
    page.drawText(ownerTxt, {
      x: x + 8, y: cy, size: 9, font: bold, color: DARK,
    })
    cy -= 11
  }

  // Medical strip (blood type + allergies)
  if (info.bloodType || info.allergies) {
    const med: string[] = []
    if (info.bloodType) med.push(`Blood: ${info.bloodType}`)
    if (info.allergies) med.push(`Allergies: ${info.allergies}`)
    const medTxt = truncate(med.join(' | '), CARD_W - 16, 7, font)
    page.drawText(medTxt, {
      x: x + 8, y: cy, size: 7, font, color: GRAY,
    })
    cy -= 10
  } else {
    cy -= 4
  }

  // Divider
  page.drawLine({
    start: { x: x + 8, y: cy },
    end: { x: x + CARD_W - 8, y: cy },
    thickness: 0.3, color: rgb(0.85, 0.85, 0.85),
  })
  cy -= 10

  // Contact rows
  for (const c of info.contacts.slice(0, 4)) {
    if (cy < y + 8) break
    // Label
    const labelTxt = truncate(c.label + ':', 70, 7, bold)
    page.drawText(labelTxt, {
      x: x + 8, y: cy, size: 7, font: bold, color: TEAL,
    })
    // Name + phone
    const nameLine = c.name ? truncate(c.name, CARD_W - 90, 8, font) : ''
    if (nameLine) {
      page.drawText(nameLine, {
        x: x + 78, y: cy, size: 8, font, color: DARK,
      })
    }
    cy -= 9
    if (c.phone) {
      const phoneTxt = truncate(c.phone, CARD_W - 90, 8, bold)
      page.drawText(phoneTxt, {
        x: x + 78, y: cy, size: 8, font: bold, color: DARK,
      })
      cy -= 11
    }
  }
}

export async function generateWalletCardPdf(data: DeathboxData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique)

  const info = gatherContacts(data)
  const page = pdf.addPage([PAGE_W, PAGE_H])

  // Header above grid
  const headerTxt = 'Emergency Wallet Cards — Print on cardstock and cut to size'
  const headerW = font.widthOfTextAtSize(headerTxt, 9)
  page.drawText(headerTxt, {
    x: (PAGE_W - headerW) / 2, y: PAGE_H - 36, size: 9, font: italic, color: GRAY,
  })

  // Cut guide note
  const cutTxt = 'Standard credit card size: 3.375" x 2.125". Cut along the borders.'
  const cutW = font.widthOfTextAtSize(cutTxt, 8)
  page.drawText(cutTxt, {
    x: (PAGE_W - cutW) / 2, y: PAGE_H - 50, size: 8, font, color: GRAY,
  })

  // Grid of identical cards
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = X_OFFSET + col * (CARD_W + H_GAP)
      const y = PAGE_H - Y_OFFSET - (row + 1) * CARD_H - row * V_GAP
      drawCard(page, x, y, info, font, bold)
    }
  }

  // Footer
  const footTxt = 'liferelay.app'
  const footW = font.widthOfTextAtSize(footTxt, 7)
  page.drawText(footTxt, {
    x: (PAGE_W - footW) / 2, y: 24, size: 7, font, color: GRAY,
  })

  return pdf.save()
}
