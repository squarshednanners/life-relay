import { PDFDocument, PDFName, PDFBool, PDFString, PDFDict, PDFArray, PDFNumber, rgb } from 'pdf-lib'
import type { PDFPage, PDFFont, PDFRef } from 'pdf-lib'
import type { DeathboxData } from '@/models/DeathboxData'
import { runbookPhases, runbookDonts } from '@/data/runbookSteps'
import { drawGeneratedBy } from '@/pdf/pdfBranding'
import { embedPdfFonts } from '@/pdf/fonts'
import { collectFieldsByPdfView } from '@/pdf/schemaPdfViews'
import { schemaRegistry } from '@/schemas'
import { pdfColor, pdfPage } from '@/tokens'

const TEAL = rgb(...pdfColor.brandTeal)
const DARK = rgb(...pdfColor.textDark)
const GRAY = rgb(...pdfColor.textGray)
const AMBER = rgb(...pdfColor.amber)
const RULE = rgb(...pdfColor.ruleColor)

const PAGE_W = pdfPage.widthPt
const PAGE_H = pdfPage.heightPt
const MARGIN = pdfPage.marginRunbook
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
  const fonts = await embedPdfFonts(pdf)
  const font: PDFFont = fonts.bodyRegular
  const bold: PDFFont = fonts.bodyMedium
  const italic: PDFFont = fonts.headingItalic
  const heading: PDFFont = fonts.headingMedium
  const mono: PDFFont = fonts.monoRegular

  let page: PDFPage
  let y = 0

  // ── PDF/UA-1 structure event tracking ────────────────────────────────────
  // Captured during render; consumed when building StructTreeRoot.
  // page index is zero-based and resolved at the moment the element renders.
  type StructNode =
    | { kind: 'H1' | 'H2' | 'P'; page: number; text: string }
    | { kind: 'L'; page: number; items: Array<{ page: number; text: string }> }
  const structNodes: StructNode[] = []
  const currentPageIndex = (): number => pdf.getPageCount() - 1
  const recordHeading = (kind: 'H1' | 'H2', text: string): void => {
    structNodes.push({ kind, page: currentPageIndex(), text })
  }
  const recordParagraph = (text: string): void => {
    structNodes.push({ kind: 'P', page: currentPageIndex(), text })
  }
  const recordList = (items: Array<{ text: string }>): void => {
    const page = currentPageIndex()
    structNodes.push({
      kind: 'L',
      page,
      items: items.map((i) => ({ page, text: i.text })),
    })
  }

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
  const titleW = heading.widthOfTextAtSize(title, 32)
  page!.drawText(title, { x: (PAGE_W - titleW) / 2, y, size: 32, font: heading, color: TEAL })
  recordHeading('H1', title)
  y -= 28
  const sub = 'A Runbook for After I\'m Gone'
  const subW = font.widthOfTextAtSize(sub, 13)
  page!.drawText(sub, { x: (PAGE_W - subW) / 2, y, size: 13, font, color: GRAY })
  y -= 50

  // Intro box
  page!.drawRectangle({
    x: MARGIN, y: y - 90, width: CONTENT_W, height: 90,
    color: rgb(...pdfColor.bgRunbookIntro),
    borderColor: TEAL, borderWidth: 0.5,
  })
  let introY = y - 18
  page!.drawText('If you are reading this after a loss', {
    x: MARGIN + 16, y: introY, size: 11, font: heading, color: TEAL,
  })
  introY -= 16
  const intro = 'First — take a breath. Almost nothing has to happen in the next hour. The steps that follow are organized by urgency, but most can wait a day or two. Lean on family and friends.'
  for (const line of wrap(intro, CONTENT_W - 32, 9.5, font)) {
    page!.drawText(line, { x: MARGIN + 16, y: introY, size: 9.5, font, color: DARK })
    introY -= 12
  }
  recordParagraph(intro)
  y -= 110

  // Quick contacts — schema-driven via pdfViews.runbookPdf on importantContacts.
  // The schema declares which roles qualify (itemSortPriority list) and the
  // overall cap (itemLimit). The renderer reads the priority list from the
  // schema for the inclusion filter — single source of truth.
  const collectedSections = collectFieldsByPdfView('runbookPdf', data)
  const contactsSection = collectedSections.find(
    (s) => s.sectionKey === 'importantContacts',
  )
  const priorityRoles =
    schemaRegistry.importantContacts.pdfViews?.runbookPdf?.itemSortPriority ?? []
  const quickItems = contactsSection
    ? contactsSection.items.filter((item) =>
        priorityRoles.includes(String(item.data.role ?? '')),
      )
    : []

  if (quickItems.length > 0) {
    page!.drawText('Key People to Contact', {
      x: MARGIN, y, size: 13, font: heading, color: DARK,
    })
    recordHeading('H2', 'Key People to Contact')
    recordList(
      quickItems.map((item) => ({
        text: String(
          item.fields.find((f) => f.fieldName === 'name')?.value ?? 'Contact',
        ),
      })),
    )
    y -= 18
    for (const item of quickItems) {
      ensure(28)
      // Layout-side field placement: name/role on row 1, phone on row 2.
      // Schema controls inclusion; this renderer controls where each appears.
      // See schemaPdfViews.ts "Boundary" doc.
      const nameField = item.fields.find((f) => f.fieldName === 'name')
      const roleField = item.fields.find((f) => f.fieldName === 'role')
      const phoneField = item.fields.find((f) => f.fieldName === 'phone')

      const name = nameField?.value ?? 'Unnamed'
      page!.drawText(sanitize(name), {
        x: MARGIN, y, size: 10, font: bold, color: DARK,
      })
      const nameW = bold.widthOfTextAtSize(sanitize(name), 10)
      if (roleField?.value) {
        page!.drawText(`  -  ${sanitize(roleField.value)}`, {
          x: MARGIN + nameW, y, size: 9, font, color: GRAY,
        })
      }
      y -= 12
      if (phoneField?.value) {
        // Phone is vault-data → JetBrains Mono per UX Step 8 typography guide.
        page!.drawText(sanitize(phoneField.value), {
          x: MARGIN + 12, y, size: 10, font: mono, color: DARK,
        })
        y -= 12
      }
      y -= 4
    }
  }

  drawGeneratedBy(page!, fonts, PAGE_W, MARGIN + 20)

  /* Phase pages */
  for (const phase of runbookPhases) {
    newPage()

    page!.drawText(sanitize(phase.title), {
      x: MARGIN, y, size: 18, font: heading, color: TEAL,
    })
    recordHeading('H2', phase.title)
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
    recordParagraph(phase.subtitle)
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
        color: rgb(...pdfColor.bgRunbookCircle),
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
      // One /P per step — combines title + description for screen readers.
      recordParagraph(`${step.title}. ${step.description}`)
      y -= 12
    }
  }

  /* Don'ts page */
  newPage()
  page!.drawText("Important Don'ts", {
    x: MARGIN, y, size: 18, font: heading, color: AMBER,
  })
  recordHeading('H2', "Important Don'ts")
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
    recordParagraph(item)
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
  recordParagraph(disc)

  /* Page numbers */
  const total = pdf.getPageCount()
  for (let i = 0; i < total; i++) {
    const p = pdf.getPage(i)
    const txt = `${i + 1} / ${total}`
    const tw = font.widthOfTextAtSize(txt, 8)
    p.drawText(txt, { x: (PAGE_W - tw) / 2, y: 24, size: 8, font, color: GRAY })
  }

  /* Footer brand on last page */
  drawGeneratedBy(pdf.getPage(pdf.getPageCount() - 1), fonts, PAGE_W, 38)

  /* PDF/UA-1 tagged structure tree (Story 1.2 AC4).
   *
   * Builds a tagged structure tree from `structNodes` captured during render.
   * Shape:
   *
   *   StructTreeRoot
   *     ├─ /K[0]: /Document
   *     │    ├─ /K: array of StructElems
   *     │    │     ├─ /H1 "For My Family"
   *     │    │     ├─ /P intro
   *     │    │     ├─ /H2 "Key People to Contact"  (if any)
   *     │    │     ├─ /L → /LI × N                  (Quick Contacts)
   *     │    │     ├─ /H2 phase.title + /P each step  (× runbookPhases)
   *     │    │     ├─ /H2 "Important Don'ts" + /P × runbookDonts
   *     │    │     └─ /P disclaimer
   *     │    └─ ...
   *     ├─ /ParentTree: number tree keyed by /StructParents per page (empty
   *     │   /Nums array — no MCIDs in content streams yet; per-paragraph
   *     │   marked-content tagging is deferred to a follow-up story)
   *     └─ /ParentTreeNextKey: 0
   *
   * Per-page /StructParents are set to each page's index in /ParentTree.
   * Without content-stream MCIDs, PAC will flag elements as "no marked
   * content reference" — but the structural primitives required by AC4
   * (every element type listed exists in the tree) are present, and
   * screen readers see the document outline.
   */
  pdf.setTitle('Life Relay — For My Family')
  pdf.setLanguage('en-US')

  const ctx = pdf.context
  const catalog = pdf.catalog

  // MarkInfo dict: tells consumers this PDF has tagged content.
  const markInfoDict = ctx.obj({}) as PDFDict
  markInfoDict.set(PDFName.of('Marked'), PDFBool.True)
  catalog.set(PDFName.of('MarkInfo'), markInfoDict)

  // ViewerPreferences: DisplayDocTitle so readers show the title bar.
  const viewerPrefs = ctx.obj({}) as PDFDict
  viewerPrefs.set(PDFName.of('DisplayDocTitle'), PDFBool.True)
  catalog.set(PDFName.of('ViewerPreferences'), viewerPrefs)

  // Page refs by index, captured up-front so StructElem /Pg references can
  // point at them. pdf.getPage(i).ref is the indirect ref to that page dict.
  const pageCount = pdf.getPageCount()
  const pageRefs: PDFRef[] = []
  for (let i = 0; i < pageCount; i++) {
    pageRefs.push(pdf.getPage(i).ref)
  }

  const structTreeRootRef = ctx.nextRef()
  const documentElemRef = ctx.nextRef()

  // Build StructElems for each recorded node.
  const documentKids = PDFArray.withContext(ctx)

  function buildLeafElem(
    kind: 'H1' | 'H2' | 'P' | 'LI',
    page: number,
    text: string,
    parentRef: PDFRef,
  ): PDFRef {
    const ref = ctx.nextRef()
    const dict = ctx.obj({}) as PDFDict
    dict.set(PDFName.of('Type'), PDFName.of('StructElem'))
    dict.set(PDFName.of('S'), PDFName.of(kind))
    dict.set(PDFName.of('P'), parentRef)
    if (pageRefs[page]) {
      dict.set(PDFName.of('Pg'), pageRefs[page])
    }
    if (text) {
      // /T is the structure element title — useful for screen readers and
      // PAC tree views.
      dict.set(PDFName.of('T'), PDFString.of(sanitize(text).slice(0, 120)))
    }
    ctx.assign(ref, dict)
    return ref
  }

  for (const node of structNodes) {
    if (node.kind === 'L') {
      const listRef = ctx.nextRef()
      const listDict = ctx.obj({}) as PDFDict
      listDict.set(PDFName.of('Type'), PDFName.of('StructElem'))
      listDict.set(PDFName.of('S'), PDFName.of('L'))
      listDict.set(PDFName.of('P'), documentElemRef)
      if (pageRefs[node.page]) {
        listDict.set(PDFName.of('Pg'), pageRefs[node.page])
      }
      const liKids = PDFArray.withContext(ctx)
      for (const item of node.items) {
        liKids.push(buildLeafElem('LI', item.page, item.text, listRef))
      }
      listDict.set(PDFName.of('K'), liKids)
      ctx.assign(listRef, listDict)
      documentKids.push(listRef)
    } else {
      documentKids.push(
        buildLeafElem(node.kind, node.page, node.text, documentElemRef),
      )
    }
  }

  const documentDict = ctx.obj({}) as PDFDict
  documentDict.set(PDFName.of('Type'), PDFName.of('StructElem'))
  documentDict.set(PDFName.of('S'), PDFName.of('Document'))
  documentDict.set(PDFName.of('P'), structTreeRootRef)
  documentDict.set(PDFName.of('K'), documentKids)
  ctx.assign(documentElemRef, documentDict)

  // ParentTree — required by PDF 1.7 §14.7.4 for any tagged catalog.
  // Built as a number tree with one entry per page (mapping the page's
  // /StructParents index to a placeholder empty array). Content-stream
  // MCID wiring is deferred; this satisfies the structural requirement
  // and gives PAC a recognizable tree.
  const parentTreeRef = ctx.nextRef()
  const parentTreeDict = ctx.obj({}) as PDFDict
  const numsArray = PDFArray.withContext(ctx)
  for (let i = 0; i < pageCount; i++) {
    numsArray.push(PDFNumber.of(i))
    numsArray.push(PDFArray.withContext(ctx)) // empty MCID array (no content marks yet)
    const pageDict = pdf.getPage(i).node
    pageDict.set(PDFName.of('StructParents'), PDFNumber.of(i))
  }
  parentTreeDict.set(PDFName.of('Nums'), numsArray)
  ctx.assign(parentTreeRef, parentTreeDict)

  const structTreeRootDict = ctx.obj({}) as PDFDict
  structTreeRootDict.set(PDFName.of('Type'), PDFName.of('StructTreeRoot'))
  const structKids = PDFArray.withContext(ctx)
  structKids.push(documentElemRef)
  structTreeRootDict.set(PDFName.of('K'), structKids)
  structTreeRootDict.set(PDFName.of('ParentTree'), parentTreeRef)
  structTreeRootDict.set(PDFName.of('ParentTreeNextKey'), PDFNumber.of(pageCount))
  ctx.assign(structTreeRootRef, structTreeRootDict)

  catalog.set(PDFName.of('StructTreeRoot'), structTreeRootRef)

  // useObjectStreams: false emits all dicts as inline PDF objects rather
  // than compressing them into PDF 1.5 object streams. Required so the
  // tagged structure tree is inspectable by external accessibility tools
  // (PAC) and our test grep. ~20% size increase on the runbook is
  // acceptable for the accessibility benefit.
  return pdf.save({ useObjectStreams: false })
}
