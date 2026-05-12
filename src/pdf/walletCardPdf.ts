/**
 * Wallet Card PDF — credit-card-sized "in case of emergency" card. Layout: US
 * Letter page with 8 cards (2 cols x 4 rows) printed on cardstock and cut.
 *
 * Schema-as-truth: field selection (owner name, allergies, blood type, contact
 * names + phones) flows from `pdfViews.walletCard` schema tags. Renderer-side
 * concerns: card geometry, fonts, the cross-reference logic that filters
 * medicalInfo by people[0].id, and the fallback to beneficiaries when fewer
 * than 4 contacts are tagged.
 *
 * Why this file still references field names like 'name' and 'phone' by string
 * (in `gatherCardData`): the wallet-card layout places specific fields at
 * specific positions on the card (row 1 = name, row 2 = phone), and joins
 * sections by id (medicalInfo where personId === owner.id). Schema tags
 * declare which fields participate; this renderer decides where they sit.
 * See `schemaPdfViews.ts` "Boundary" doc for the policy.
 */
import { PDFDocument, rgb } from 'pdf-lib'
import type { PDFFont } from 'pdf-lib'
import type { DeathboxData } from '@/models/DeathboxData'
import { embedPdfFonts } from './fonts'
import {
  collectFieldsByPdfView,
  type CollectedItem,
} from './schemaPdfViews'
import { pdfColor, pdfPage } from '@/tokens'

const TEAL = rgb(...pdfColor.brandTeal)
const DARK = rgb(...pdfColor.textDark)
const GRAY = rgb(...pdfColor.textGray)
const WHITE = rgb(...pdfColor.white)

const PAGE_W = pdfPage.widthPt
const PAGE_H = pdfPage.heightPt
const CARD_W = 243 // 3.375 inch
const CARD_H = 153 // 2.125 inch
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
    .replace(/[‘’′]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/—/g, '--')
    .replace(/–/g, '-')
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

export interface WalletCardData {
  owner: string
  bloodType: string
  allergies: string
  contacts: Array<{ label: string; name: string; phone: string }>
}

/**
 * Find a single field value in a collected item by field name.
 * Returns empty string if missing or empty.
 */
function fieldValue(item: CollectedItem, fieldName: string): string {
  return item.fields.find((f) => f.fieldName === fieldName)?.value ?? ''
}

/**
 * Pull out the wallet card's data from schema-tagged sections plus the small
 * amount of cross-section logic the renderer needs (owner = people[0],
 * medicalInfo filtered by personId match, beneficiary fallback).
 */
export function gatherCardData(data: DeathboxData): WalletCardData {
  const sections = collectFieldsByPdfView('walletCard', data)
  const sectionByKey = new Map(sections.map((s) => [s.sectionKey, s]))

  // Owner — first person tagged for walletCard (itemLimit:1 enforced by schema)
  const peopleSection = sectionByKey.get('people')
  const ownerItem = peopleSection?.items[0]
  const owner = ownerItem ? fieldValue(ownerItem, 'name') : ''
  const ownerId = String(ownerItem?.itemId ?? '')

  // Medical — find the medicalInfo entry matching the owner's id (cross-section).
  // The schema tags allergies + a notes-derived blood type for walletCard;
  // we look up the right item ourselves.
  let bloodType = ''
  let allergies = ''
  const medicalSection = sectionByKey.get('medicalInfo')
  const ownerMedical = medicalSection?.items.find(
    (item) => String(item.data.personId ?? '') === ownerId,
  ) ?? medicalSection?.items[0]
  if (ownerMedical) {
    bloodType = fieldValue(ownerMedical, 'notes') // schema's format extracts blood type
    allergies = fieldValue(ownerMedical, 'allergies')
  }

  // Contacts — important contacts sorted + limited by schema; renderer
  // converts each item into a {label, name, phone} row.
  const contactRows: Array<{ label: string; name: string; phone: string }> = []
  const contactsSection = sectionByKey.get('importantContacts')
  if (contactsSection) {
    for (const item of contactsSection.items) {
      contactRows.push({
        label: item.itemLabel ?? 'Contact',
        name: fieldValue(item, 'name'),
        phone: fieldValue(item, 'phone'),
      })
    }
  }

  // Beneficiary fallback — fill any remaining slots up to 4 with beneficiaries
  // that have a phone number. Schema-tagged for walletCard with label 'Beneficiary'.
  if (contactRows.length < 4) {
    const beneficiariesSection = sectionByKey.get('beneficiaries')
    if (beneficiariesSection) {
      for (const item of beneficiariesSection.items) {
        if (contactRows.length >= 4) break
        const phone = fieldValue(item, 'phone')
        if (!phone) continue
        contactRows.push({
          label: item.itemLabel ?? 'Beneficiary',
          name: fieldValue(item, 'name'),
          phone,
        })
      }
    }
  }

  return { owner, bloodType, allergies, contacts: contactRows }
}

function drawCard(
  page: ReturnType<PDFDocument['addPage']>,
  x: number,
  y: number,
  info: WalletCardData,
  font: PDFFont,
  bold: PDFFont,
) {
  // Card background
  page.drawRectangle({
    x,
    y,
    width: CARD_W,
    height: CARD_H,
    color: WHITE,
    borderColor: rgb(...pdfColor.dividerMedium),
    borderWidth: 0.5,
  })

  // Top teal banner
  page.drawRectangle({
    x,
    y: y + CARD_H - 22,
    width: CARD_W,
    height: 22,
    color: TEAL,
  })
  page.drawText('In Case of Emergency', {
    x: x + 8,
    y: y + CARD_H - 15,
    size: 9,
    font: bold,
    color: WHITE,
  })
  page.drawText('Life Relay', {
    x: x + CARD_W - bold.widthOfTextAtSize('Life Relay', 8) - 8,
    y: y + CARD_H - 14,
    size: 8,
    font: bold,
    color: WHITE,
  })

  let cy = y + CARD_H - 32

  // Owner name
  if (info.owner) {
    const ownerTxt = truncate(info.owner, CARD_W - 16, 9, bold)
    page.drawText(ownerTxt, {
      x: x + 8,
      y: cy,
      size: 9,
      font: bold,
      color: DARK,
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
      x: x + 8,
      y: cy,
      size: 7,
      font,
      color: GRAY,
    })
    cy -= 10
  } else {
    cy -= 4
  }

  // Divider
  page.drawLine({
    start: { x: x + 8, y: cy },
    end: { x: x + CARD_W - 8, y: cy },
    thickness: 0.3,
    color: rgb(...pdfColor.dividerLight),
  })
  cy -= 10

  // Contact rows
  for (const c of info.contacts.slice(0, 4)) {
    if (cy < y + 8) break
    // Label
    const labelTxt = truncate(c.label + ':', 70, 7, bold)
    page.drawText(labelTxt, {
      x: x + 8,
      y: cy,
      size: 7,
      font: bold,
      color: TEAL,
    })
    // Name + phone
    const nameLine = c.name ? truncate(c.name, CARD_W - 90, 8, font) : ''
    if (nameLine) {
      page.drawText(nameLine, {
        x: x + 78,
        y: cy,
        size: 8,
        font,
        color: DARK,
      })
    }
    cy -= 9
    if (c.phone) {
      // Phone rendered in Inter Medium (not JetBrains Mono): mono advance
      // widths at 8pt overflow the wallet card's narrow phone slot for full
      // international numbers. The UX "vault-data → mono" guide targets
      // strings where character-by-character distinguishability matters
      // (BIP-39 words, account numbers, fingerprints). Phones don't fall in
      // that category — dial-pad spacing convention works in any font.
      const phoneTxt = truncate(c.phone, CARD_W - 90, 8, bold)
      page.drawText(phoneTxt, {
        x: x + 78,
        y: cy,
        size: 8,
        font: bold,
        color: DARK,
      })
      cy -= 11
    }
  }
}

export async function generateWalletCardPdf(
  data: DeathboxData,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const fonts = await embedPdfFonts(pdf)
  const font: PDFFont = fonts.bodyRegular
  const bold: PDFFont = fonts.bodyMedium
  const italic: PDFFont = fonts.headingItalic

  const info = gatherCardData(data)
  const page = pdf.addPage([PAGE_W, PAGE_H])

  // Header above grid
  const headerTxt = 'Emergency Wallet Cards — Print on cardstock and cut to size'
  const headerW = font.widthOfTextAtSize(headerTxt, 9)
  page.drawText(headerTxt, {
    x: (PAGE_W - headerW) / 2,
    y: PAGE_H - 36,
    size: 9,
    font: italic,
    color: GRAY,
  })

  // Cut guide note
  const cutTxt = 'Standard credit card size: 3.375" x 2.125". Cut along the borders.'
  const cutW = font.widthOfTextAtSize(cutTxt, 8)
  page.drawText(cutTxt, {
    x: (PAGE_W - cutW) / 2,
    y: PAGE_H - 50,
    size: 8,
    font,
    color: GRAY,
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
    x: (PAGE_W - footW) / 2,
    y: 24,
    size: 7,
    font,
    color: GRAY,
  })

  return pdf.save()
}
