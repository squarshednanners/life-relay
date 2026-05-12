/**
 * Emergency Information Sheet PDF — thin renderer driven by schema-tagged
 * `pdfViews.emergencySheet` metadata.
 *
 * Schema-as-truth: this file does NOT hardcode field names or labels. Every
 * section, label, sort priority, and value formatter is declared on the
 * relevant schema field via `pdfViews: { emergencySheet: { ... } }`. Adding
 * a new field to a schema with the appropriate tag automatically appears
 * here on next render — no code change required.
 *
 * Layout discipline (LEFT vs RIGHT column placement, header/footer, page
 * size, font selection) lives here because it is genuinely renderer-side
 * concern. The user-facing item picker (EmergencySheetSelections) also lives
 * here because selection is per-render, not per-schema.
 */
import { PDFDocument, rgb } from 'pdf-lib'
import type { PDFFont } from 'pdf-lib'
import type { DeathboxData } from '@/models/DeathboxData'
import { drawLifeRelayMark, drawGeneratedBy } from './pdfBranding'
import { embedPdfFonts } from './fonts'
import { drawWitnessLine, WITNESS_LINE_DEFAULT_HEIGHT } from './witnessLine'
import {
  collectFieldsByPdfView,
  type CollectedItem,
  type CollectedSection,
} from './schemaPdfViews'
import { pdfColor, pdfPage, pdfSpacing } from '@/tokens'

export interface EmergencySheetSelections {
  people: string[]
  contacts: number[]
  includeHealthInsurance: boolean
  medical: number[]
  storage: string[]
  crypto: number[]
  includeLegalDocuments: boolean
}

const PAGE_WIDTH = pdfPage.widthPt
const PAGE_HEIGHT = pdfPage.heightPt
const MARGIN = pdfPage.marginEmergencySheet
const COL_GAP = 16
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN
const COL_WIDTH = (CONTENT_WIDTH - COL_GAP) / 2

/**
 * Layout config — which schema-tagged sections appear in which column.
 * This is a renderer-side decision (visual placement), not schema-side.
 * Sections not listed here do NOT appear, even if they're tagged for the view.
 */
const SECTION_COLUMN: Record<string, 'left' | 'right'> = {
  people: 'left',
  importantContacts: 'left',
  healthInsurance: 'left',
  medicalInfo: 'right',
  physicalStorageLocations: 'right',
  legalDocuments: 'right',
  cryptoAssets: 'right',
}

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

/**
 * Apply the user's selection picker to a collected section, returning only
 * the items the user marked for inclusion. Returns null if the section was
 * filtered out entirely or wasn't selected at all.
 */
function applySelections(
  section: CollectedSection,
  selections: EmergencySheetSelections,
  data: DeathboxData,
): CollectedSection | null {
  let filteredItems: CollectedItem[]

  switch (section.sectionKey) {
    case 'people': {
      // selections.people is array of person IDs
      filteredItems = section.items.filter((item) =>
        selections.people.includes(String(item.itemId ?? '')),
      )
      break
    }
    case 'importantContacts': {
      const allContacts = data.importantContacts ?? []
      const selectedRaw = selections.contacts
        .map((i) => allContacts[i])
        .filter(Boolean)
      filteredItems = section.items.filter((item) =>
        selectedRaw.some((c) => c === item.data),
      )
      break
    }
    case 'healthInsurance': {
      filteredItems = selections.includeHealthInsurance ? section.items : []
      break
    }
    case 'medicalInfo': {
      const allMedical = data.medicalInfo ?? []
      const selectedRaw = selections.medical
        .map((i) => allMedical[i])
        .filter(Boolean)
      filteredItems = section.items.filter((item) =>
        selectedRaw.some((m) => m === item.data),
      )
      break
    }
    case 'physicalStorageLocations': {
      filteredItems = section.items.filter((item) =>
        selections.storage.includes(String(item.itemId ?? '')),
      )
      break
    }
    case 'legalDocuments': {
      filteredItems = selections.includeLegalDocuments ? section.items : []
      break
    }
    case 'cryptoAssets': {
      const allCrypto = data.cryptoAssets ?? []
      const selectedRaw = (selections.crypto ?? [])
        .map((i) => allCrypto[i])
        .filter(Boolean)
      filteredItems = section.items.filter((item) =>
        selectedRaw.some((c) => c === item.data),
      )
      break
    }
    default:
      filteredItems = []
  }

  if (filteredItems.length === 0) return null
  return { ...section, items: filteredItems }
}

/**
 * Validate that a health-insurance item has at least one substantive value.
 * Mirrors the original generator's "validPolicies" filter so empty placeholder
 * policies don't render an empty section.
 */
function isHealthInsuranceItemUseful(item: CollectedItem): boolean {
  return item.fields.some((f) => f.value && f.value.trim() !== '')
}

/**
 * Validate that legalDocuments has at least one of the key fields populated.
 * Original generator skips the section entirely if all are empty.
 */
function isLegalDocumentsItemUseful(item: CollectedItem): boolean {
  return item.fields.some((f) => f.value && f.value.trim() !== '')
}

export async function generateEmergencySheet(
  data: DeathboxData,
  selections: EmergencySheetSelections,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const fonts = await embedPdfFonts(pdfDoc)
  const font: PDFFont = fonts.bodyRegular
  const bold: PDFFont = fonts.bodyMedium
  const heading: PDFFont = fonts.headingMedium
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])

  let y = PAGE_HEIGHT - MARGIN

  // --- Header ---
  const headerHeight = 40
  page.drawRectangle({
    x: 0,
    y: y - headerHeight + 15,
    width: PAGE_WIDTH,
    height: headerHeight,
    color: rgb(...pdfColor.emergencyRed),
  })

  const title = 'EMERGENCY INFORMATION SHEET'
  const titleWidth = heading.widthOfTextAtSize(title, 16)
  page.drawText(title, {
    x: (PAGE_WIDTH - titleWidth) / 2,
    y: y - headerHeight + 27,
    size: 16,
    font: heading,
    color: rgb(...pdfColor.white),
  })
  y -= headerHeight + 8

  // --- Date ---
  const dateStr = sanitize(
    `Prepared: ${new Date(data.updatedAt || new Date().toISOString()).toLocaleDateString()}`,
  )
  page.drawText(dateStr, {
    x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(dateStr, 7),
    y,
    size: 7,
    font,
    color: rgb(...pdfColor.textMuted),
  })
  y -= 16

  // --- Render primitives ---
  const fontSize = 8
  const labelSize = 7
  const sectionTitleSize = 9
  const lineHeight = 11
  const sectionGap = 6

  function drawSectionTitle(text: string, x: number, colW: number) {
    // Witness Line — 3pt accent-700 left border. Cross-surface primitive
    // (same as the screen <WitnessSection> wrapper and the full-vault PDF's
    // section headers). Replaces the prior grey banner background; the
    // title text is offset right by `pdfSpacing.witnessLinePaddingLeftPt`
    // (24pt) to give the line its breathing room.
    drawWitnessLine(page, {
      x,
      yTop: y + WITNESS_LINE_DEFAULT_HEIGHT - 3,
      yBottom: y - 3,
    })
    page.drawText(sanitize(text), {
      x: x + pdfSpacing.witnessLinePaddingLeftPt,
      y: y + 1,
      size: sectionTitleSize,
      font: heading,
      color: rgb(...pdfColor.textMedium),
    })
    // Suppress the unused colW parameter — kept in the signature so the
    // function can grow back to column-aware rendering without API churn.
    void colW
    y -= 16
  }

  function drawItemHeading(text: string, x: number, isCompact: boolean) {
    page.drawText(sanitize(truncate(text, 60)), {
      x,
      y,
      size: isCompact ? fontSize : fontSize + 1,
      font: bold,
      color: isCompact ? rgb(...pdfColor.textDark) : rgb(...pdfColor.black),
    })
    y -= lineHeight
  }

  function drawField(
    label: string,
    value: string | undefined,
    x: number,
    maxW: number,
  ): boolean {
    if (!value || value.trim() === '') return false
    const clean = sanitize(truncate(value.trim().replace(/\n/g, ', '), 100))
    const labelText = sanitize(label + ': ')
    const labelW = bold.widthOfTextAtSize(labelText, labelSize)
    page.drawText(labelText, {
      x,
      y,
      size: labelSize,
      font: bold,
      color: rgb(...pdfColor.textLabel),
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
          color: rgb(...pdfColor.black),
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
        color: rgb(...pdfColor.black),
      })
    }
    y -= lineHeight
    return true
  }

  // ========================================
  // COLLECT SCHEMA-TAGGED SECTIONS + APPLY USER SELECTIONS
  // ========================================
  const allSections = collectFieldsByPdfView('emergencySheet', data)
  const filteredSections = allSections
    .map((section) => applySelections(section, selections, data))
    .filter((s): s is CollectedSection => s !== null)

  /**
   * Draw a single schema-collected section into the column at column-x = x.
   * Item-level "useful" filters apply to sections like healthInsurance and
   * legalDocuments that should suppress entirely-empty items.
   */
  function drawCollectedSection(
    section: CollectedSection,
    x: number,
    colW: number,
    columnSide: 'left' | 'right',
  ) {
    const usefulItems = section.items.filter((item) => {
      if (section.sectionKey === 'healthInsurance')
        return isHealthInsuranceItemUseful(item)
      if (section.sectionKey === 'legalDocuments')
        return isLegalDocumentsItemUseful(item)
      return item.fields.some((f) => f.value && f.value.trim() !== '') ||
        Boolean(item.itemLabel)
    })

    if (usefulItems.length === 0) return

    drawSectionTitle(section.sectionLabel, x, colW)

    for (const item of usefulItems) {
      if (y < MARGIN + 30) break

      // Item heading (e.g., person name, contact name+role)
      if (item.itemLabel && item.itemLabel.trim() !== '') {
        const isLargeHeading = section.sectionKey === 'people'
        drawItemHeading(item.itemLabel, x + 2, !isLargeHeading)
      }

      // Field indentation:
      // - section headers + sections without item heading: x + 2
      // - sections with bold item heading (importantContacts, medicalInfo,
      //   storage, crypto): x + 6 (indented under heading)
      const indent = item.itemLabel && item.itemLabel.trim() !== ''
        ? section.sectionKey === 'people'
          ? x + 2
          : x + 6
        : x + 2
      const fieldMaxW = colW - (indent === x + 2 ? 4 : 8)

      for (const field of item.fields) {
        if (y < MARGIN + 30) break
        if (field.manualEntryBlank) {
          // Render blank line for handwritten entry per FR8
          drawField(field.label, '____________________', indent, fieldMaxW)
        } else {
          drawField(field.label, field.value, indent, fieldMaxW)
        }
      }

      // Inter-item gap depends on column side (mirrors original)
      y -= columnSide === 'right' ? 4 : 2
    }
    y -= sectionGap
  }

  // ========================================
  // LEFT COLUMN
  // ========================================
  const leftX = MARGIN
  const savedY = y

  for (const section of filteredSections) {
    if (SECTION_COLUMN[section.sectionKey] !== 'left') continue
    drawCollectedSection(section, leftX, COL_WIDTH, 'left')
  }
  const leftColumnBottom = y

  // ========================================
  // RIGHT COLUMN
  // ========================================
  const rightX = MARGIN + COL_WIDTH + COL_GAP
  y = savedY

  for (const section of filteredSections) {
    if (SECTION_COLUMN[section.sectionKey] !== 'right') continue
    drawCollectedSection(section, rightX, COL_WIDTH, 'right')
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
      color: rgb(...pdfColor.dividerMedium),
    })
    y -= 12

    const footer =
      'This is a summary sheet only. See the full Life Relay document for complete information.'
    const footerW = font.widthOfTextAtSize(footer, 7)
    page.drawText(footer, {
      x: (PAGE_WIDTH - footerW) / 2,
      y,
      size: 7,
      font,
      color: rgb(...pdfColor.textMuted),
    })
    y -= 14
    drawGeneratedBy(page, fonts, PAGE_WIDTH, y)
  }

  // Logo mark in bottom-left corner
  drawLifeRelayMark(page, MARGIN, MARGIN + 10, 18)

  return pdfDoc.save()
}
