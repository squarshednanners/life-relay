import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { PDFPage, PDFFont } from 'pdf-lib'
import type { DeathboxData } from '@/models/DeathboxData'
import { runbookPhases, runbookDonts } from '@/data/runbookSteps'
import { drawGeneratedBy } from '@/pdf/pdfBranding'

const TEAL = rgb(0.06, 0.46, 0.43)
const DARK = rgb(0.15, 0.15, 0.15)
const GRAY = rgb(0.45, 0.45, 0.45)
const AMBER = rgb(0.71, 0.42, 0.04)
const RULE = rgb(0.82, 0.82, 0.82)

const PAGE_W = 612
const PAGE_H = 792
const MARGIN = 54
const CONTENT_W = PAGE_W - 2 * MARGIN

function sanitize(s: string): string {
  return s
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, '--')
    .replace(/\u2013/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x20-\x7E\n\r\t]/g, '?')
}

function wrap(text: string, maxW: number, size: number, font: PDFFont): string[] {
  const clean = sanitize(text).replace(/\s+/g, ' ').trim()
  if (!clean) return []
  const words = clean.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w
    if (font.widthOfTextAtSize(test, size) > maxW && cur) {
      lines.push(cur)
      cur = w
    } else {
      cur = test
    }
  }
  if (cur) lines.push(cur)
  return lines
}

export async function generateRunbookPdfDocument(data: DeathboxData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique)

  let page: PDFPage
  let y = 0

  function newPage() {
    page = pdf.addPage([PAGE_W, PAGE_H])
    page.drawRectangle({ x: 0, y: PAGE_H - 3, width: PAGE_W, height: 3, color: TEAL })
    y = PAGE_H - MARGIN
  }

  function ensure(needed: number) {
    if (y < MARGIN + needed) newPage()
  }

  /* Title page */
  newPage()
  y = PAGE_H - 140
  const title = 'For My Family'
  const titleW = bold.widthOfTextAtSize(title, 32)
  page!.drawText(title, { x: (PAGE_W - titleW) / 2, y, size: 32, font: bold, color: TEAL })
  y -= 28
  const sub = 'A Runbook for After I\'m Gone'
  const subW = font.widthOfTextAtSize(sub, 13)
  page!.drawText(sub, { x: (PAGE_W - subW) / 2, y, size: 13, font, color: GRAY })
  y -= 50

  // Intro box
  page!.drawRectangle({
    x: MARGIN, y: y - 90, width: CONTENT_W, height: 90,
    color: rgb(0.95, 0.99, 0.98),
    borderColor: TEAL, borderWidth: 0.5,
  })
  let introY = y - 18
  page!.drawText('If you are reading this after a loss', {
    x: MARGIN + 16, y: introY, size: 11, font: bold, color: TEAL,
  })
  introY -= 16
  const intro = 'First — take a breath. Almost nothing has to happen in the next hour. The steps that follow are organized by urgency, but most can wait a day or two. Lean on family and friends.'
  for (const line of wrap(intro, CONTENT_W - 32, 9.5, font)) {
    page!.drawText(line, { x: MARGIN + 16, y: introY, size: 9.5, font, color: DARK })
    introY -= 12
  }
  y -= 110

  // Quick contacts (if we have them)
  const PRIORITY_ROLES = ['Executor', 'Attorney', 'Trustee', 'Doctor', 'Accountant', 'Financial Advisor']
  const contacts = (data.importantContacts as any[]) || []
  const quick = contacts
    .filter(c => c.role && PRIORITY_ROLES.some(r => c.role.toLowerCase().includes(r.toLowerCase())))
    .slice(0, 8)

  if (quick.length > 0) {
    page!.drawText('Key People to Contact', {
      x: MARGIN, y, size: 13, font: bold, color: DARK,
    })
    y -= 18
    for (const c of quick) {
      ensure(28)
      page!.drawText(sanitize(c.name || 'Unnamed'), {
        x: MARGIN, y, size: 10, font: bold, color: DARK,
      })
      const role = c.role ? `  -  ${sanitize(c.role)}` : ''
      const nameW = bold.widthOfTextAtSize(sanitize(c.name || 'Unnamed'), 10)
      if (role) {
        page!.drawText(role, { x: MARGIN + nameW, y, size: 9, font, color: GRAY })
      }
      y -= 12
      if (c.phone) {
        page!.drawText(sanitize(c.phone), {
          x: MARGIN + 12, y, size: 10, font, color: DARK,
        })
        y -= 12
      }
      y -= 4
    }
  }

  drawGeneratedBy(page!, font, PAGE_W, MARGIN + 20)

  /* Phase pages */
  for (const phase of runbookPhases) {
    newPage()

    page!.drawText(sanitize(phase.title), {
      x: MARGIN, y, size: 18, font: bold, color: TEAL,
    })
    y -= 7
    page!.drawLine({
      start: { x: MARGIN, y },
      end: { x: MARGIN + CONTENT_W, y },
      thickness: 1.5, color: TEAL,
    })
    y -= 8
    for (const line of wrap(phase.subtitle, CONTENT_W, 10, italic)) {
      page!.drawText(line, { x: MARGIN, y, size: 10, font: italic, color: GRAY })
      y -= 14
    }
    y -= 8

    for (let i = 0; i < phase.steps.length; i++) {
      const step = phase.steps[i]
      const titleLines = wrap(step.title, CONTENT_W - 28, 11, bold)
      const descLines = wrap(step.description, CONTENT_W - 28, 9.5, font)
      const refLines = step.references && step.references.length > 0
        ? wrap('See: ' + step.references.map(r => r.label).join('; '), CONTENT_W - 28, 9, italic)
        : []
      const blockH = 14 + titleLines.length * 14 + descLines.length * 12 + refLines.length * 11 + 12
      ensure(blockH)

      // Number badge
      page!.drawCircle({
        x: MARGIN + 9, y: y - 4, size: 9,
        color: rgb(0.93, 0.99, 0.97),
        borderColor: TEAL, borderWidth: 0.7,
      })
      const numStr = String(i + 1)
      const numW = bold.widthOfTextAtSize(numStr, 9)
      page!.drawText(numStr, {
        x: MARGIN + 9 - numW / 2, y: y - 7, size: 9, font: bold, color: TEAL,
      })

      // Title
      const textX = MARGIN + 28
      for (const line of titleLines) {
        page!.drawText(line, { x: textX, y, size: 11, font: bold, color: DARK })
        y -= 14
      }
      // Description
      for (const line of descLines) {
        page!.drawText(line, { x: textX, y, size: 9.5, font, color: DARK })
        y -= 12
      }
      // References
      for (const line of refLines) {
        page!.drawText(line, { x: textX, y, size: 9, font: italic, color: GRAY })
        y -= 11
      }
      y -= 12
    }
  }

  /* Don'ts page */
  newPage()
  page!.drawText("Important Don'ts", {
    x: MARGIN, y, size: 18, font: bold, color: AMBER,
  })
  y -= 7
  page!.drawLine({
    start: { x: MARGIN, y },
    end: { x: MARGIN + CONTENT_W, y },
    thickness: 1.5, color: AMBER,
  })
  y -= 18

  for (const item of runbookDonts) {
    const lines = wrap(item, CONTENT_W - 18, 10, font)
    ensure(lines.length * 13 + 8)
    page!.drawText('-', { x: MARGIN, y, size: 12, font: bold, color: AMBER })
    for (const line of lines) {
      page!.drawText(line, { x: MARGIN + 14, y, size: 10, font, color: DARK })
      y -= 13
    }
    y -= 6
  }

  /* Disclaimer */
  ensure(40)
  y -= 20
  page!.drawLine({
    start: { x: MARGIN, y }, end: { x: MARGIN + CONTENT_W, y },
    thickness: 0.5, color: RULE,
  })
  y -= 14
  const disc = 'This runbook is general guidance, not legal advice. Specific obligations vary by state and by the deceased\'s circumstances. Consult an attorney for your situation.'
  for (const line of wrap(disc, CONTENT_W, 9, italic)) {
    page!.drawText(line, { x: MARGIN, y, size: 9, font: italic, color: GRAY })
    y -= 12
  }

  /* Page numbers */
  const total = pdf.getPageCount()
  for (let i = 0; i < total; i++) {
    const p = pdf.getPage(i)
    const txt = `${i + 1} / ${total}`
    const tw = font.widthOfTextAtSize(txt, 8)
    p.drawText(txt, { x: (PAGE_W - tw) / 2, y: 24, size: 8, font, color: GRAY })
  }

  /* Footer brand on last page */
  drawGeneratedBy(pdf.getPage(pdf.getPageCount() - 1), font, PAGE_W, 38)

  return pdf.save()
}
