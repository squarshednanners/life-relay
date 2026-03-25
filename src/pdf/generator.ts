import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { PDFPage, PDFFont } from 'pdf-lib'
import type { DeathboxData } from '@/models/DeathboxData'
import { getSchemasByGroup } from '@/schemas/index'
import { addSchemaSectionToPDF } from '@/pdf/schemaToPdf'
import { drawGeneratedBy } from '@/pdf/pdfBranding'

/* ── Design tokens ───────────────────────────────────────── */

const TEAL       = rgb(0.06, 0.46, 0.43)
const DARK       = rgb(0.15, 0.15, 0.15)
const GRAY       = rgb(0.45, 0.45, 0.45)
const RULE_COLOR = rgb(0.82, 0.82, 0.82)

const PAGE_W    = 612 // US Letter
const PAGE_H    = 792
const MARGIN    = 54  // 0.75 in
const CONTENT_W = PAGE_W - 2 * MARGIN

const GROUP_ORDER = [
  'People & Contacts',
  'Security & Access',
  'Insurance, Medical & Benefits',
  'Finances',
  'Digital & Crypto Assets',
  'Property & Household',
  'Documents & Storage',
  'Final Wishes',
]

/* ── Text helpers ────────────────────────────────────────── */

function sanitize(text: string): string {
  return text
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, '--')
    .replace(/\u2013/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u2192/g, '->')   // →
    .replace(/\u2190/g, '<-')   // ←
    .replace(/\u2191/g, '^')    // ↑
    .replace(/\u2193/g, 'v')    // ↓
    .replace(/[^\x20-\x7E\n\r\t]/g, '?')
}

function wrapText(text: string, maxWidth: number, fontSize: number, font: PDFFont): string[] {
  const clean = sanitize(text).replace(/\r\n|\r|\n/g, ' ').replace(/\s+/g, ' ').trim()
  if (!clean) return []
  const words = clean.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if (!w) continue
    const test = cur ? `${cur} ${w}` : w
    if (font.widthOfTextAtSize(test, fontSize) > maxWidth && cur) {
      lines.push(cur)
      cur = w
    } else {
      cur = test
    }
  }
  if (cur) lines.push(cur)
  return lines
}

function wrapTextarea(text: string, maxWidth: number, fontSize: number, font: PDFFont): string[] {
  const paragraphs = sanitize(text).split(/\r\n|\r|\n/)
  const lines: string[] = []
  for (const para of paragraphs) {
    const trimmed = para.trim()
    if (!trimmed) { lines.push(''); continue }
    const words = trimmed.split(/\s+/)
    let cur = ''
    for (const w of words) {
      if (!w) continue
      const test = cur ? `${cur} ${w}` : w
      if (font.widthOfTextAtSize(test, fontSize) > maxWidth && cur) {
        lines.push(cur)
        cur = w
      } else {
        cur = test
      }
    }
    if (cur) lines.push(cur)
  }
  return lines
}

function schemaHasData(schema: any, data: DeathboxData): boolean {
  if (schema.sectionKey === 'lifeInsurance.policies') {
    return !!(data.lifeInsurance?.policies?.length)
  }
  const d = (data as any)[schema.sectionKey]
  if (schema.isArray) return !!(d && Array.isArray(d) && d.length > 0)
  return !!d
}

/* ── Main generator ──────────────────────────────────────── */

export async function generatePDFDocument(
  data: DeathboxData,
  includedSections?: Set<string>,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const font   = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold   = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let page: PDFPage = null as any
  let y = PAGE_H - MARGIN

  // TOC tracking — filled during content rendering, drawn on reserved page afterward
  const tocEntries: { label: string; pageNum: number; level: 'group' | 'section' }[] = []

  /* ── Page management ─────────────────────────────────── */

  const newPage = (): PDFPage => {
    page = pdfDoc.addPage([PAGE_W, PAGE_H])
    y = PAGE_H - MARGIN
    // Thin accent line at top of every content page
    page.drawRectangle({ x: 0, y: PAGE_H - 3, width: PAGE_W, height: 3, color: TEAL })
    y -= 6
    return page
  }

  const ensureSpace = (needed: number = 50): boolean => {
    if (!page || y < MARGIN + needed) {
      newPage()
      return true
    }
    return false
  }

  /* ── Drawing callbacks (passed to schemaToPdf) ───────── */

  // Section title within a group (e.g. "People", "Financial Accounts")
  const addTitle = (text: string) => {
    ensureSpace(60)
    // Extra spacing if not at top of page
    if (y < PAGE_H - MARGIN - 20) y -= 18

    const clean = sanitize(text)
    tocEntries.push({ label: text, pageNum: pdfDoc.getPageCount(), level: 'section' })

    page.drawText(clean, {
      x: MARGIN,
      y,
      size: 13,
      font: bold,
      color: DARK,
    })
    y -= 5
    // Partial underline — extends to ~half content width or text width, whichever is smaller
    const ruleW = Math.min(bold.widthOfTextAtSize(clean, 13) + 16, CONTENT_W * 0.5)
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: MARGIN + ruleW, y },
      thickness: 0.5,
      color: RULE_COLOR,
    })
    y -= 14
  }

  // Item header within a section (e.g. person name, account name)
  // Teal left accent bar + bold text
  const addSectionHeader = (text: string) => {
    ensureSpace(34)

    // Subtle separator between items (skip if near top of page)
    if (y < PAGE_H - MARGIN - 50) {
      y -= 4
      page.drawLine({
        start: { x: MARGIN + 10, y: y + 2 },
        end: { x: MARGIN + CONTENT_W - 10, y: y + 2 },
        thickness: 0.5,
        color: RULE_COLOR,
      })
      y -= 10
    }

    // Left accent bar
    page.drawRectangle({
      x: MARGIN,
      y: y - 3,
      width: 3,
      height: 15,
      color: TEAL,
    })

    page.drawText(sanitize(text), {
      x: MARGIN + 12,
      y,
      size: 11,
      font: bold,
      color: DARK,
    })
    y -= 20
  }

  // Label: value field pair
  const addField = (
    label: string,
    value: string | undefined,
    indent: number = 0,
    isTextarea: boolean = false,
  ) => {
    if (!value || value.trim() === '' || value === 'N/A') return
    ensureSpace(18)

    const fieldX = MARGIN + 12 + indent
    const cleanLabel = label
      ? sanitize(label.endsWith(':') ? label : `${label}:`)
      : ''
    const labelW = cleanLabel ? bold.widthOfTextAtSize(cleanLabel, 8.5) + 6 : 0
    const valueX = fieldX + labelW
    const maxValW = MARGIN + CONTENT_W - valueX

    // Guard: if label is so wide there's no room for value, fall back to stacked layout
    if (maxValW < 80) {
      // Stacked: label on its own line, value below full-width
      if (cleanLabel) {
        page.drawText(cleanLabel, {
          x: fieldX,
          y,
          size: 8.5,
          font: bold,
          color: GRAY,
        })
        y -= 12
      }
      const stackedMaxW = MARGIN + CONTENT_W - fieldX
      const lines = isTextarea
        ? wrapTextarea(value, stackedMaxW, 10, font)
        : wrapText(value, stackedMaxW, 10, font)
      for (const line of lines) {
        if (y < MARGIN + 14) newPage()
        page.drawText(line, { x: fieldX, y, size: 10, font, color: DARK })
        y -= 13
      }
      y -= 3
      return
    }

    // Inline layout: label then value on same line
    if (cleanLabel) {
      page.drawText(cleanLabel, {
        x: fieldX,
        y,
        size: 8.5,
        font: bold,
        color: GRAY,
      })
    }

    const lines = isTextarea
      ? wrapTextarea(value, maxValW, 10, font)
      : wrapText(value, maxValW, 10, font)

    for (const line of lines) {
      if (y < MARGIN + 14) newPage()
      page.drawText(line, {
        x: valueX,
        y,
        size: 10,
        font,
        color: DARK,
      })
      y -= 13
    }
    y -= 3
  }

  /* ── Title page ──────────────────────────────────────── */

  page = pdfDoc.addPage([PAGE_W, PAGE_H])

  // Top accent bar
  page.drawRectangle({ x: 0, y: PAGE_H - 6, width: PAGE_W, height: 6, color: TEAL })

  y = PAGE_H - 120

  // Brand name
  const brandText = 'Life Relay'
  const brandW = bold.widthOfTextAtSize(brandText, 42)
  page.drawText(brandText, {
    x: (PAGE_W - brandW) / 2, y, size: 42, font: bold, color: TEAL,
  })
  y -= 30

  // Subtitle
  const sub = 'Legacy Information Document'
  const subW = font.widthOfTextAtSize(sub, 14)
  page.drawText(sub, {
    x: (PAGE_W - subW) / 2, y, size: 14, font, color: GRAY,
  })
  y -= 40

  // Centered decorative rule
  page.drawLine({
    start: { x: PAGE_W / 2 - 60, y },
    end: { x: PAGE_W / 2 + 60, y },
    thickness: 0.5,
    color: RULE_COLOR,
  })
  y -= 30

  // Disclaimer
  const disc = 'This document provides organized personal, financial, and logistical information '
    + 'intended to assist executors, family members, and authorized representatives. '
    + 'It is not a legal document or will, but serves as a practical reference guide.'
  for (const line of wrapText(disc, CONTENT_W - 40, 9.5, font)) {
    page.drawText(line, { x: MARGIN + 20, y, size: 9.5, font, color: GRAY })
    y -= 14
  }
  y -= 24

  // People
  if (data.people?.length) {
    const prep = 'Prepared for the legacy of'
    const prepW = font.widthOfTextAtSize(prep, 11)
    page.drawText(prep, {
      x: (PAGE_W - prepW) / 2, y, size: 11, font, color: TEAL,
    })
    y -= 30

    for (const person of data.people) {
      if (y < 120) break
      if (person.name) {
        const n = sanitize(person.name)
        const nW = bold.widthOfTextAtSize(n, 18)
        page.drawText(n, {
          x: (PAGE_W - nW) / 2, y, size: 18, font: bold, color: DARK,
        })
        y -= 22
      }
      const details = [
        person.dateOfBirth ? `Born ${person.dateOfBirth}` : '',
        person.address || '',
      ].filter(Boolean)
      for (const d of details) {
        const dt = sanitize(d)
        const dw = font.widthOfTextAtSize(dt, 10)
        page.drawText(dt, {
          x: (PAGE_W - Math.min(dw, CONTENT_W)) / 2, y, size: 10, font, color: GRAY,
        })
        y -= 14
      }
      y -= 12
    }
  }

  // Date at bottom of title page
  if (data.updatedAt) {
    const dt = sanitize(`Last updated ${new Date(data.updatedAt).toLocaleDateString()}`)
    const dw = font.widthOfTextAtSize(dt, 9)
    page.drawText(dt, {
      x: (PAGE_W - dw) / 2, y: MARGIN + 36, size: 9, font, color: GRAY,
    })
  }

  // Generated by branding
  drawGeneratedBy(page, font, PAGE_W, MARGIN + 20)

  /* ── Reserve TOC page (filled in after content is rendered) ── */

  const tocPage = pdfDoc.addPage([PAGE_W, PAGE_H])

  /* ── Content pages ───────────────────────────────────── */

  const schemasByGroup = getSchemasByGroup()

  for (const groupName of GROUP_ORDER) {
    let groupSchemas = schemasByGroup[groupName] || []

    if (includedSections) {
      groupSchemas = groupSchemas.filter(s => includedSections.has(s.sectionKey))
    }

    // Check if this group has any data at all
    let hasContent = false
    for (const schema of groupSchemas) {
      if (schemaHasData(schema, data)) { hasContent = true; break }
    }

    const hasNotes = groupName === 'Final Wishes'
      && data.notes
      && (!includedSections || includedSections.has('notes'))

    if (!hasContent && !hasNotes) continue

    // ── Group header — always starts a new page ──
    newPage()
    const groupClean = sanitize(groupName)
    tocEntries.push({ label: groupName, pageNum: pdfDoc.getPageCount(), level: 'group' })

    page.drawText(groupClean, {
      x: MARGIN, y, size: 16, font: bold, color: TEAL,
    })
    y -= 7
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: MARGIN + CONTENT_W, y },
      thickness: 1.5,
      color: TEAL,
    })
    y -= 24

    // Process each schema section in this group
    for (const schema of groupSchemas) {
      let sectionData: any

      if (schema.sectionKey === 'lifeInsurance.policies') {
        sectionData = data.lifeInsurance?.policies
      } else {
        sectionData = (data as any)[schema.sectionKey]
      }

      if (!sectionData) continue
      if (schema.isArray && (!Array.isArray(sectionData) || sectionData.length === 0)) continue

      addSchemaSectionToPDF(
        schema,
        sectionData,
        data,
        addTitle,
        addSectionHeader,
        addField,
        ensureSpace,
      )
    }

    // Special case: Notes (not in schema registry)
    if (hasNotes) {
      addTitle('Additional Notes')
      ensureSpace(30)
      for (const line of wrapTextarea(data.notes!, CONTENT_W, 10, font)) {
        ensureSpace(14)
        page.drawText(sanitize(line), { x: MARGIN, y, size: 10, font, color: DARK })
        y -= 14
      }
    }
  }

  /* ── Draw TOC on reserved page ───────────────────────── */

  let tocY = PAGE_H - MARGIN
  tocPage.drawRectangle({ x: 0, y: PAGE_H - 3, width: PAGE_W, height: 3, color: TEAL })
  tocY -= 6

  tocPage.drawText('Contents', {
    x: MARGIN, y: tocY, size: 18, font: bold, color: TEAL,
  })
  tocY -= 8
  tocPage.drawLine({
    start: { x: MARGIN, y: tocY },
    end: { x: MARGIN + CONTENT_W, y: tocY },
    thickness: 1,
    color: TEAL,
  })
  tocY -= 28

  for (const entry of tocEntries) {
    if (tocY < MARGIN + 20) break

    const isGroup = entry.level === 'group'
    const indent = isGroup ? 0 : 18
    const sz = isGroup ? 12 : 10
    const f = isGroup ? bold : font
    const c = isGroup ? DARK : GRAY

    // Entry label
    tocPage.drawText(sanitize(entry.label), {
      x: MARGIN + indent, y: tocY, size: sz, font: f, color: c,
    })

    // Right-aligned page number
    const pg = String(entry.pageNum)
    const pgW = font.widthOfTextAtSize(pg, sz)
    tocPage.drawText(pg, {
      x: MARGIN + CONTENT_W - pgW, y: tocY, size: sz, font, color: GRAY,
    })

    tocY -= isGroup ? 24 : 17
  }

  /* ── Page numbers on every page (except title) ───────── */

  const total = pdfDoc.getPageCount()
  for (let i = 0; i < total; i++) {
    if (i === 0) continue // skip title page
    const p = pdfDoc.getPage(i)
    const txt = `${i + 1} / ${total}`
    const tw = font.widthOfTextAtSize(txt, 8)
    p.drawText(txt, {
      x: (PAGE_W - tw) / 2, y: 24, size: 8, font, color: GRAY,
    })
  }

  return pdfDoc.save()
}
