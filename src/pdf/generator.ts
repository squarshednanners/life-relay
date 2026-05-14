import { PDFDocument, PDFRef, PDFArray, PDFDict, PDFName, PDFNumber, PDFString, StandardFonts, rgb } from 'pdf-lib'
import type { PDFPage, PDFFont } from 'pdf-lib'
import type { DeathboxData } from '@/models/DeathboxData'
import { getSchemasByGroup, schemaRegistry } from '@/schemas/index'
import { addSchemaSectionToPDF, type AttachmentSummaryEntry } from '@/pdf/schemaToPdf'
import { AttachmentStore } from '@/services/AttachmentStore'
import { drawGeneratedBy } from '@/pdf/pdfBranding'
import { embedPdfFonts } from '@/pdf/fonts'
import { drawWitnessLine, WITNESS_LINE_DEFAULT_HEIGHT } from '@/pdf/witnessLine'
import { pdfColor, pdfPage, pdfTypeScale, pdfSize } from '@/tokens'

/* ── Design tokens (legacy aliases for the local file) ────────── */

const TEAL       = rgb(...pdfColor.brandTeal)
const DARK       = rgb(...pdfColor.textDark)
const GRAY       = rgb(...pdfColor.textGray)
const RULE_COLOR = rgb(...pdfColor.ruleColor)

const PAGE_W    = pdfPage.widthPt
const PAGE_H    = pdfPage.heightPt
const MARGIN    = pdfPage.marginGenerator
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
    // Convert non-ASCII dashes / arrows to single-char ASCII so the
    // output never contains the multi-char sequences that trigger
    // JetBrains Mono's programming ligatures (`--`, `->`, `<-`). Those
    // ligature glyphs have malformed CFF data in the WOFF subset and
    // crash fontkit. The Helvetica fallback in `addField` handles JBM
    // crashes at draw-time, but avoiding the trigger is faster + quieter.
    .replace(/\u2014/g, '-') // em dash \u2192 single hyphen (was '--')
    .replace(/\u2013/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u2192/g, '>')   // →
    .replace(/\u2190/g, '<')   // ←
    .replace(/\u2191/g, '^')    // ↑
    .replace(/\u2193/g, 'v')    // ↓
    // Collapse user-typed multi-hyphens to a single hyphen — JBM's `--`
    // ligature glyph has malformed CFF data in the WOFF subset and
    // crashes fontkit. Loses some typographic richness but preserves
    // separator semantics. The Helvetica fallback in addField still
    // catches anything that slips through.
    .replace(/--+/g, '-')
    .replace(/[^\x20-\x7E\n\r\t]/g, '?')
}

/**
 * Defensive text-width measurement.
 *
 * `font.widthOfTextAtSize` calls fontkit's full OpenType layout/shaping
 * engine, which can throw "Trying to access beyond buffer length" on
 * certain subsetted fonts with malformed CFF charstrings (e.g.,
 * JetBrains Mono in some @fontsource releases). One bad glyph would
 * otherwise kill the entire PDF generation.
 *
 * Fallback heuristic: estimate width per character. ~0.55 em is a
 * reasonable average for proportional Inter; ~0.6 em for monospace.
 * The fallback is imperfect — wrapped lines may be slightly too short
 * or too long — but the PDF still generates with all content present.
 */
const FONT_MEASURE_FALLBACK_WARNED = new WeakSet<PDFFont>()
function safeMeasure(text: string, fontSize: number, font: PDFFont): number {
  try {
    return font.widthOfTextAtSize(text, fontSize)
  } catch (err) {
    if (!FONT_MEASURE_FALLBACK_WARNED.has(font)) {
      FONT_MEASURE_FALLBACK_WARNED.add(font)
      console.error(
        'PDF text layout: font.widthOfTextAtSize threw — falling back to char-width estimate. PDF wrapping will be approximate for this font.',
        err,
      )
    }
    // ~0.55 em per character for proportional fonts; close enough for
    // wrap-line bucketing. Monospace fonts measure slightly wider but
    // the fallback is intentionally conservative (wraps a touch early).
    return text.length * fontSize * 0.55
  }
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
    if (safeMeasure(test, fontSize, font) > maxWidth && cur) {
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
      if (safeMeasure(test, fontSize, font) > maxWidth && cur) {
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
  const fonts = await embedPdfFonts(pdfDoc)
  // Preload attachment metadata for every referenced id so attachment
  // fields can render filename / type / size / date in one pass (Story
  // 1.7). Sync rendering can then look up by id without awaiting.
  const attachmentMeta = await preloadAttachmentMetadata(data)
  // Local aliases — body text uses Inter; headings upgrade to `heading`
  // (Source Serif 4 Medium) at specific use-sites below.
  const font: PDFFont = fonts.bodyRegular
  const bold: PDFFont = fonts.bodyMedium
  const heading: PDFFont = fonts.headingMedium
  const mono: PDFFont = fonts.monoRegular
  // Helvetica fallback — pdf-lib's built-in StandardFont. Does NOT go
  // through fontkit, so layout cannot fail with the "buffer length"
  // RangeError that some subsetted WOFF glyphs trigger. Used as a
  // data-preserving fallback in `addField` when the primary font throws.
  const helveticaFallback: PDFFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

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
      font: heading,
      color: DARK,
    })
    y -= 5
    // Partial underline — extends to ~half content width or text width, whichever is smaller
    const ruleW = Math.min(heading.widthOfTextAtSize(clean, 13) + 16, CONTENT_W * 0.5)
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: MARGIN + ruleW, y },
      thickness: 0.5,
      color: RULE_COLOR,
    })
    y -= 14
  }

  // Item header within a section (e.g. person name, account name)
  // Witness line + bold text. Balanced spacing — enough breathing room
  // above the witness line (so it doesn't crowd the separator) and
  // below the header text (so the first field doesn't crowd the header).
  const addSectionHeader = (text: string) => {
    ensureSpace(30)

    // Subtle separator between items (skip if near top of page).
    if (y < PAGE_H - MARGIN - 50) {
      y -= 4
      page.drawLine({
        start: { x: MARGIN + 10, y: y + 2 },
        end: { x: MARGIN + CONTENT_W - 10, y: y + 2 },
        thickness: 0.5,
        color: RULE_COLOR,
      })
      y -= 10 // breathing room before the witness line + header text
    }

    // Witness Line — cross-surface primitive (3pt accent-700, same as screen
    // <WitnessSection> wrapper). Replaces the prior teal accent bar.
    drawWitnessLine(page, {
      x: MARGIN,
      yTop: y + WITNESS_LINE_DEFAULT_HEIGHT - 3,
      yBottom: y - 3,
    })

    // Tighter horizontal inset between the witness line and the
    // section-header text in the PDF — the token value (24pt) reads
    // generous on letter paper. Local override; screen WitnessSection
    // stays at the broader cross-surface spacing.
    const SECTION_HEADER_TEXT_INSET = 10
    page.drawText(sanitize(text), {
      x: MARGIN + SECTION_HEADER_TEXT_INSET,
      y,
      size: 11,
      font: bold,
      color: DARK,
    })
    y -= 18 // gap to first field below the header
  }

  // Label: value field pair.
  //
  // Typographic Inversion (Story 1.6) — print-appropriate density.
  //   Label  — bodyMedium @ 8.5pt (`PDF_LABEL_SIZE`), GRAY.
  //   Value  — prose: bodyRegular @ 10pt (`PDF_VALUE_PROSE_SIZE`), DARK.
  //          — mono:  monoRegular @ 10pt (`PDF_VALUE_MONO_SIZE`), DARK.
  //
  // These sizes are deliberately smaller than the screen `body-md`/`body-sm`
  // tokens because printed documents are read at near-100% scale and the
  // density of a runbook benefits from compact typography. The inversion
  // (label smaller + lighter than value) is preserved by weight + color
  // delta + the stacked layout — not by dramatic size difference.
  //
  // This applies to the SCHEMA-DRIVEN full vault PDF. The bespoke PDFs
  // (emergencySheet, walletCard, attorneyPrep, runbook) have hand-tuned
  // page budgets and use their own typography.
  const PDF_LABEL_SIZE = 8.5
  const PDF_VALUE_PROSE_SIZE = 10
  const PDF_VALUE_MONO_SIZE = 10
  const addField = (
    label: string,
    value: string | undefined,
    indent: number = 0,
    // isTextarea retained for callsite API compatibility but no longer
    // drives layout — length + explicit-newline detection inside this
    // function chooses inline vs stacked.
    _isTextarea: boolean = false,
    displayAs: 'prose' | 'mono' = 'prose',
  ) => {
    void _isTextarea
    if (!value || value.trim() === '' || value === 'N/A') return

    const labelSize = PDF_LABEL_SIZE
    const valueSize = displayAs === 'mono' ? PDF_VALUE_MONO_SIZE : PDF_VALUE_PROSE_SIZE
    const valueFont = displayAs === 'mono' ? mono : font
    // Line height proportional to size — use ~1.3 for tight-but-readable PDF
    // rhythm. (Token-side line-height ratios are wider for screen comfort;
    // PDF density is tighter by convention.)
    const valueLineHeight = Math.round(valueSize * 1.3)
    const labelLineHeight = Math.round(labelSize * 1.3)
    const postFieldGap = 6

    const fieldX = MARGIN + 12 + indent
    const cleanLabel = label
      ? sanitize(label.endsWith(':') ? label : `${label}:`)
      : ''

    // Length-based layout decision: inline when the value fits on a
    // small number of lines next to the label, stacked when it doesn't.
    // Single-line and short multi-line content stays compact; truly
    // long prose stacks so the value gets full horizontal width.
    //
    // Applies to every field type — text, textarea, attachment. Even
    // user-typed multi-line textarea content goes inline when it's
    // small enough; only content that wraps beyond INLINE_MAX_LINES
    // (at the inline width) falls back to stacked.
    const stackedMaxW = MARGIN + CONTENT_W - fieldX
    const INLINE_MAX_LINES = 3 // permissive — anything ≤ 3 wrapped lines goes inline
    const hasExplicitNewlines = value.includes('\n')
    const wrapFn = hasExplicitNewlines ? wrapTextarea : wrapText
    let useStackedLayout = false
    let valueStartX = fieldX
    let lines: string[]
    const labelW = cleanLabel ? bold.widthOfTextAtSize(cleanLabel, labelSize) : 0
    if (cleanLabel) {
      // Try inline first.
      const inlineValueX = fieldX + labelW + 6 // 6pt gap
      const inlineValueMaxW = MARGIN + CONTENT_W - inlineValueX
      if (inlineValueMaxW >= 60) {
        const inlineLines = wrapFn(value, inlineValueMaxW, valueSize, valueFont)
        if (inlineLines.length <= INLINE_MAX_LINES) {
          valueStartX = inlineValueX
          lines = inlineLines
        } else {
          useStackedLayout = true
          lines = wrapFn(value, stackedMaxW, valueSize, valueFont)
        }
      } else {
        // Label is so wide it'd leave no room for the value — stack.
        useStackedLayout = true
        lines = wrapFn(value, stackedMaxW, valueSize, valueFont)
      }
    } else {
      // No label — just render the value at the standard inset.
      lines = wrapFn(value, stackedMaxW, valueSize, valueFont)
    }

    // Reserve space for label + every wrapped line up front so a long
    // value can't orphan its label across a page break (Story 1.6 code
    // review caught this hazard).
    const labelHeight = useStackedLayout && cleanLabel ? labelLineHeight : 0
    ensureSpace(labelHeight + lines.length * valueLineHeight + postFieldGap)

    if (useStackedLayout && cleanLabel) {
      // Stacked: label on its own line, value below.
      page.drawText(cleanLabel, {
        x: fieldX,
        y,
        size: labelSize,
        font: bold,
        color: GRAY,
      })
      y -= labelLineHeight
    } else if (!useStackedLayout && cleanLabel) {
      // Inline: label sits to the left of the first value line. Shift
      // the label baseline up slightly so the smaller-font label visually
      // aligns with the larger value text on the same row.
      const labelBaselineOffset = (valueSize - labelSize) / 2
      page.drawText(cleanLabel, {
        x: fieldX,
        y: y - labelBaselineOffset,
        size: labelSize,
        font: bold,
        color: GRAY,
      })
    }

    // Wrap drawText in a try/catch per line. fontkit can throw during
    // text layout on certain subsetted-font glyphs (a "Trying to access
    // beyond buffer length" RangeError originating in `_getCBox` /
    // `_getMetrics`). When that happens, retry the same line with the
    // Helvetica StandardFont — pdf-lib's built-in font, which does NOT
    // go through fontkit's layout engine and is reliable for ASCII.
    //
    // The user gets the actual data (just in a different, less-pretty
    // font for the affected line) rather than a useless placeholder.
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (y < MARGIN + valueLineHeight) newPage()
      // Inline-mode hanging-indent fix: line 0 sits next to the label
      // at `valueStartX`; subsequent wrapped lines return to `fieldX`
      // so the full content width is used. In stacked mode every line
      // starts at `fieldX` already, so this is a no-op there.
      const lineX = !useStackedLayout && i > 0 ? fieldX : valueStartX
      try {
        page.drawText(line, { x: lineX, y, size: valueSize, font: valueFont, color: DARK })
      } catch (err) {
        console.error(
          `PDF text draw failed for line "${line}" in field "${label}" — retrying with Helvetica fallback to preserve the data.`,
          err,
        )
        try {
          page.drawText(line, {
            x: lineX,
            y,
            size: valueSize,
            font: helveticaFallback,
            color: DARK,
          })
        } catch (err2) {
          // Even Helvetica fails (should be unreachable for ASCII —
          // sanitize() strips non-ASCII upstream). Last-ditch: note the
          // unrenderable line so the survivor knows data is missing.
          console.error(
            `PDF text draw failed even with Helvetica fallback for line "${line}" — line dropped.`,
            err2,
          )
          try {
            page.drawText('[content unrenderable — see schema data]', {
              x: lineX,
              y,
              size: valueSize,
              font: helveticaFallback,
              color: GRAY,
            })
          } catch {
            // Truly give up. The field is dropped.
          }
        }
      }
      y -= valueLineHeight
    }
    y -= postFieldGap
  }

  /* ── Title page ──────────────────────────────────────── */

  page = pdfDoc.addPage([PAGE_W, PAGE_H])

  // Top accent bar
  page.drawRectangle({ x: 0, y: PAGE_H - 6, width: PAGE_W, height: 6, color: TEAL })

  // Embed the cover photo up-front so the header origin can be chosen
  // based on its presence — without a photo the whole header drops to
  // close the empty band that would otherwise sit mid-page.
  const coverImage = await tryEmbedCoverPhoto(pdfDoc, data)
  y = coverImage ? PAGE_H - 70 : PAGE_H - 180

  // Brand name
  const brandText = 'Life Relay'
  const brandSize = pdfTypeScale.titlePage
  const brandW = heading.widthOfTextAtSize(brandText, brandSize)
  page.drawText(brandText, {
    x: (PAGE_W - brandW) / 2, y, size: brandSize, font: heading, color: TEAL,
  })
  y -= 32

  // Subtitle
  const sub = 'Legacy Information Document'
  const subSize = pdfTypeScale.bodySm
  const subW = font.widthOfTextAtSize(sub, subSize)
  page.drawText(sub, {
    x: (PAGE_W - subW) / 2, y, size: subSize, font, color: GRAY,
  })
  y -= 28

  // Centered decorative rule
  page.drawLine({
    start: { x: PAGE_W / 2 - 60, y },
    end: { x: PAGE_W / 2 + 60, y },
    thickness: pdfSize.thinRule,
    color: RULE_COLOR,
  })
  y -= 32

  // Dedication block — first 1–2 people, always with name + details.
  // Sits directly below the centered rule, above the cover photo:
  //   1 person  → centered name + address + phone
  //   2+ people → first two side-by-side, each with name + address + phone
  const people = (data as { people?: Array<{ name?: unknown; address?: unknown; phone?: unknown }> }).people
  const personRecords = (people ?? []).filter(
    p => typeof p?.name === 'string' && (p.name as string).trim().length > 0,
  )
  if (personRecords.length > 0) {
    const prep = 'Prepared for the legacy of'
    const prepSize = 16
    const prepW = heading.widthOfTextAtSize(prep, prepSize)
    page.drawText(prep, {
      x: (PAGE_W - prepW) / 2,
      y,
      size: prepSize,
      font: heading,
      color: TEAL,
    })
    y -= 30

    const NAME_SIZE = 18
    const DETAIL_SIZE = 10
    const personDetails = (p: { address?: unknown; phone?: unknown }): string[] => {
      const out: string[] = []
      // Address fields are `type: 'textarea'` and may contain explicit
      // newlines (e.g., "123 Main St\nApt 4B\nNew York, NY"). Split
      // each line so the dedication block renders address-as-stanza
      // rather than as a single overflowing line (Story 1.7c review).
      if (typeof p.address === 'string') {
        for (const line of p.address.split(/\r?\n/)) {
          const trimmed = line.trim()
          if (trimmed.length > 0) out.push(trimmed)
        }
      }
      if (typeof p.phone === 'string' && p.phone.trim().length > 0) out.push(p.phone.trim())
      return out
    }
    /**
     * Draw a string centered within a horizontal slot. Wraps if it
     * exceeds `width`. Returns the y position after the last line
     * drawn (caller subtracts to advance past the block).
     */
    const drawCenteredWrapped = (
      text: string,
      x: number,
      width: number,
      startY: number,
      size: number,
      lineFont: typeof font,
      color: typeof DARK,
      lineHeight: number,
    ): number => {
      const sanitized = sanitize(text)
      let cursorY = startY
      for (const line of wrapText(sanitized, width, size, lineFont)) {
        const w = lineFont.widthOfTextAtSize(line, size)
        page.drawText(line, {
          x: x + (width - Math.min(w, width)) / 2,
          y: cursorY,
          size,
          font: lineFont,
          color,
        })
        cursorY -= lineHeight
      }
      return cursorY
    }

    if (personRecords.length === 1) {
      const p = personRecords[0]
      y = drawCenteredWrapped(p.name as string, MARGIN, CONTENT_W, y, NAME_SIZE, heading, DARK, 22)
      for (const detail of personDetails(p)) {
        y = drawCenteredWrapped(detail, MARGIN, CONTENT_W, y, DETAIL_SIZE, font, GRAY, 14)
      }
    } else {
      // 2+ people: render the first two side-by-side with full details.
      // Anyone past index 1 is intentionally omitted — the cover stays
      // legible at three columns and the People section carries the rest.
      const COLUMN_GAP = 24
      const colWidth = (CONTENT_W - COLUMN_GAP) / 2
      const leftX = MARGIN
      const rightX = MARGIN + colWidth + COLUMN_GAP
      // Render both columns with parallel y tracking — the taller column
      // wins; y advances by the larger of the two (lower y = further
      // down the page in pdf-lib's coordinate space).
      const startY = y
      const renderColumn = (
        p: { name?: unknown; address?: unknown; phone?: unknown },
        colX: number,
        colW: number,
      ): number => {
        let colY = drawCenteredWrapped(
          p.name as string,
          colX,
          colW,
          startY,
          NAME_SIZE,
          heading,
          DARK,
          22,
        )
        for (const detail of personDetails(p)) {
          colY = drawCenteredWrapped(detail, colX, colW, colY, DETAIL_SIZE, font, GRAY, 14)
        }
        return colY
      }
      const leftEndY = renderColumn(personRecords[0], leftX, colWidth)
      const rightEndY = renderColumn(personRecords[1], rightX, colWidth)
      y = Math.min(leftEndY, rightEndY)
    }
    y -= 20
  }

  // Cover photo (Story 1.7c) — centered, aspect-preserved, capped at
  // 4"×4". Any failure (missing blob, unsupported format, decode error)
  // silently skips the cover — the PDF must always generate. When
  // absent, push the cursor down so the disclaimer doesn't collapse
  // toward the dedication block.
  if (coverImage) {
    const maxBox = 288 // 4" at 72dpi
    const scaled = coverImage.scaleToFit(maxBox, maxBox)
    const x = (PAGE_W - scaled.width) / 2
    page.drawImage(coverImage, {
      x,
      y: y - scaled.height,
      width: scaled.width,
      height: scaled.height,
    })
    y -= scaled.height + 60
  } else {
    y -= 90
  }

  // Disclaimer — 9.5pt is below the UX scale; pdfSize-namespaced.
  const disc = 'This document provides organized personal, financial, and logistical information '
    + 'intended to assist executors, family members, and authorized representatives. '
    + 'It is not a legal document or will, but serves as a practical reference guide.'
  const discSize = 9.5 // renderer-side: between pdfSize.body (9) and pdfSize.itemHeading (10)
  for (const line of wrapText(disc, CONTENT_W - 40, discSize, font)) {
    page.drawText(line, { x: MARGIN + 20, y, size: discSize, font, color: GRAY })
    y -= 14
  }
  y -= 24

  // (The old per-person card block lived here. Replaced by the
  // single CSV-style dedication line above the disclaimer — people
  // details belong in the People section of the body, not the cover.)

  // Generated by branding
  drawGeneratedBy(page, fonts, PAGE_W, MARGIN + 20)

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
      x: MARGIN, y, size: 16, font: heading, color: TEAL,
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
        attachmentMeta,
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
    x: MARGIN, y: tocY, size: 18, font: heading, color: TEAL,
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
    const f = isGroup ? heading : font
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

  /* ── PDF outline (bookmarks) for sidebar navigation ──── */
  // Group entries become top-level outline items; section entries nest under their group.

  const context = pdfDoc.context
  const catalog = pdfDoc.catalog

  // Build hierarchical structure: groups contain sections
  type OutlineItem = { label: string; pageNum: number; children: OutlineItem[] }
  const outlineRoots: OutlineItem[] = []
  let currentGroup: OutlineItem | null = null

  for (const entry of tocEntries) {
    if (entry.level === 'group') {
      currentGroup = { label: entry.label, pageNum: entry.pageNum, children: [] }
      outlineRoots.push(currentGroup)
    } else if (currentGroup) {
      currentGroup.children.push({ label: entry.label, pageNum: entry.pageNum, children: [] })
    }
  }

  if (outlineRoots.length > 0) {
    // Outline root dict
    const outlineRootRef = context.nextRef()

    // Recursively register outline items, returning their refs.
    // Block-scoped because it closes over `context`/`pdfDoc`/`PAGE_H` and
    // is only used to build the outline tree — hoisting to module scope
    // would require threading those dependencies through.
    // eslint-disable-next-line no-inner-declarations
    function registerItem(item: OutlineItem, parentRef: PDFRef): { ref: PDFRef; lastChildRef?: PDFRef } {
      const itemRef = context.nextRef()
      const childRefs: PDFRef[] = []

      // First pass: allocate refs for children
      for (let _i = 0; _i < item.children.length; _i++) {
        childRefs.push(context.nextRef())
      }

      const dict = context.obj({
        Title: PDFString.of(sanitize(item.label)),
        Parent: parentRef,
        Dest: PDFArray.withContext(context),
      }) as PDFDict
      dict.set(PDFName.of('Title'), PDFString.of(sanitize(item.label)))
      dict.set(PDFName.of('Parent'), parentRef)

      // Destination: [pageRef /XYZ left top zoom]
      const pageRef = pdfDoc.getPage(item.pageNum - 1).ref
      const destArray = PDFArray.withContext(context)
      destArray.push(pageRef)
      destArray.push(PDFName.of('XYZ'))
      destArray.push(PDFNumber.of(0))
      destArray.push(PDFNumber.of(PAGE_H))
      destArray.push(PDFNumber.of(0))
      dict.set(PDFName.of('Dest'), destArray)

      if (childRefs.length > 0) {
        dict.set(PDFName.of('First'), childRefs[0])
        dict.set(PDFName.of('Last'), childRefs[childRefs.length - 1])
        dict.set(PDFName.of('Count'), PDFNumber.of(childRefs.length))
      }

      context.assign(itemRef, dict)

      // Recursively register children, linking siblings via Prev/Next
      for (let i = 0; i < item.children.length; i++) {
        const childItem = item.children[i]
        const childRef = childRefs[i]
        const childDict = context.obj({}) as PDFDict
        childDict.set(PDFName.of('Title'), PDFString.of(sanitize(childItem.label)))
        childDict.set(PDFName.of('Parent'), itemRef)

        const childPageRef = pdfDoc.getPage(childItem.pageNum - 1).ref
        const childDest = PDFArray.withContext(context)
        childDest.push(childPageRef)
        childDest.push(PDFName.of('XYZ'))
        childDest.push(PDFNumber.of(0))
        childDest.push(PDFNumber.of(PAGE_H))
        childDest.push(PDFNumber.of(0))
        childDict.set(PDFName.of('Dest'), childDest)

        if (i > 0) childDict.set(PDFName.of('Prev'), childRefs[i - 1])
        if (i < childRefs.length - 1) childDict.set(PDFName.of('Next'), childRefs[i + 1])

        context.assign(childRef, childDict)
      }

      return { ref: itemRef }
    }

    // Build top-level items
    const topRefs: PDFRef[] = []
    for (const root of outlineRoots) {
      const { ref } = registerItem(root, outlineRootRef)
      topRefs.push(ref)
    }

    // Link top-level siblings
    for (let i = 0; i < topRefs.length; i++) {
      const itemDict = context.lookup(topRefs[i]) as PDFDict
      if (i > 0) itemDict.set(PDFName.of('Prev'), topRefs[i - 1])
      if (i < topRefs.length - 1) itemDict.set(PDFName.of('Next'), topRefs[i + 1])
    }

    // Build outline root
    const outlineRootDict = context.obj({}) as PDFDict
    outlineRootDict.set(PDFName.of('Type'), PDFName.of('Outlines'))
    outlineRootDict.set(PDFName.of('First'), topRefs[0])
    outlineRootDict.set(PDFName.of('Last'), topRefs[topRefs.length - 1])
    outlineRootDict.set(PDFName.of('Count'), PDFNumber.of(outlineRoots.length))
    context.assign(outlineRootRef, outlineRootDict)

    catalog.set(PDFName.of('Outlines'), outlineRootRef)
    catalog.set(PDFName.of('PageMode'), PDFName.of('UseOutlines'))
  }

  return pdfDoc.save()
}

/**
 * Walk the vault for every attachment-typed field reference and load
 * each one's metadata (filename / type / size / date) so the PDF
 * renderer can show per-file lists synchronously. Story 1.7.
 *
 * Walks `arraySchema` nested fields recursively (Story 1.7 review finding
 * P4) and honors dotted sectionKeys (P5). Raced against a 5-second
 * timeout (P12) so a hung Dexie open (e.g., blocked behind a v3 upgrade
 * transaction during PWA autoUpdate) doesn't deadlock PDF generation —
 * the renderer degrades to count-only output instead.
 */
async function preloadAttachmentMetadata(
  data: DeathboxData,
): Promise<Map<string, AttachmentSummaryEntry>> {
  const out = new Map<string, AttachmentSummaryEntry>()
  const referencedIds: string[] = []
  for (const [sectionKey, schema] of Object.entries(schemaRegistry)) {
    const sectionValue = readSectionByKey(data, sectionKey)
    if (sectionValue === undefined || sectionValue === null) continue
    const items: unknown[] = schema.isArray
      ? Array.isArray(sectionValue)
        ? sectionValue
        : []
      : [sectionValue]
    for (const item of items) {
      collectPdfIds(item, schema.fields, referencedIds)
    }
  }
  if (referencedIds.length === 0) return out
  try {
    const store = new AttachmentStore()
    const meta = await Promise.race([
      store.getMeta(referencedIds),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('preloadAttachmentMetadata: 5s timeout')), 5000),
      ),
    ])
    for (const m of meta) {
      out.set(m.id, {
        filename: m.filename,
        mimeType: m.mimeType,
        sizeBytes: m.sizeBytes,
        uploadedAt: m.uploadedAt,
      })
    }
  } catch (err) {
    // IndexedDB unavailable, Dexie open hang, or any other failure ->
    // fall back to the empty map. The schema renderer degrades to a
    // "N files attached" count line, which is still useful and keeps
    // the PDF generator usable.
    console.error('preloadAttachmentMetadata: degrading to count-only render:', err)
  }
  return out
}

function readSectionByKey(data: DeathboxData, sectionKey: string): unknown {
  if (!sectionKey.includes('.')) {
    return (data as Record<string, unknown>)[sectionKey]
  }
  return sectionKey.split('.').reduce<unknown>(
    (acc, part) =>
      acc && typeof acc === 'object'
        ? (acc as Record<string, unknown>)[part]
        : undefined,
    data,
  )
}

function collectPdfIds(
  item: unknown,
  fields: import('@/models/FormSchema').FormFieldSchema[],
  out: string[],
): void {
  if (!item || typeof item !== 'object') return
  const obj = item as Record<string, unknown>
  for (const field of fields) {
    if (!field.name) continue
    if (field.type === 'attachment') {
      const v = obj[field.name]
      if (Array.isArray(v)) {
        for (const id of v) {
          if (typeof id === 'string' && id.length > 0) out.push(id)
        }
      } else if (typeof v === 'string' && v.length > 0) {
        out.push(v)
      }
    } else if (field.type === 'array' && field.arraySchema) {
      const nested = obj[field.name]
      if (Array.isArray(nested)) {
        for (const child of nested) {
          collectPdfIds(child, field.arraySchema.fields, out)
        }
      }
    }
  }
}

/**
 * Load + embed the vault's cover photo into the PDF (Story 1.7c).
 * Returns the embedded `PDFImage` ref on success, or `null` on any
 * failure (no cover set, missing blob, unsupported format that
 * Canvas can't decode, etc.).
 *
 * The PDF generation MUST NOT fail because of a bad cover. Every
 * error path is caught + logged + swallowed.
 *
 * `pdf-lib` natively embeds only PNG and JPEG. For other formats
 * (WebP, AVIF, HEIC) we convert via the Canvas API to PNG before
 * embedding. The conversion path is gated on browser decode support;
 * if the browser can't render the image, the cover is skipped.
 */
async function tryEmbedCoverPhoto(
  pdfDoc: PDFDocument,
  data: DeathboxData,
): Promise<import('pdf-lib').PDFImage | null> {
  const id = data.coverPhotoAttachmentId
  if (typeof id !== 'string' || id.length === 0) return null
  try {
    const store = new AttachmentStore()
    const record = await store.get(id)
    if (!record) return null
    const mimeType = (record.mimeType ?? '').toLowerCase()
    // Defensive Uint8Array reconstruction. Dexie returns the typed-array
    // intact in browsers, but fake-indexeddb (test) sometimes returns
    // a plain ArrayBuffer or an Array-of-numbers. Guard explicitly so
    // `.buffer`/`.byteOffset` access doesn't throw on non-Uint8Array.
    // Use `ArrayBuffer.isView` (works cross-realm — `instanceof Uint8Array`
    // fails between jsdom/test realms) and `Object.prototype.toString.call`
    // to detect ArrayBuffer reliably.
    let bytes: Uint8Array
    const tag = Object.prototype.toString.call(record.blob)
    if (ArrayBuffer.isView(record.blob)) {
      const view = record.blob as ArrayBufferView
      bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
    } else if (tag === '[object ArrayBuffer]') {
      bytes = new Uint8Array(record.blob as unknown as ArrayBuffer)
    } else if (Array.isArray(record.blob)) {
      bytes = Uint8Array.from(record.blob as number[])
    } else {
      return null
    }
    if (mimeType === 'image/png') {
      return await pdfDoc.embedPng(bytes)
    }
    if (mimeType === 'image/jpeg') {
      return await pdfDoc.embedJpg(bytes)
    }
    // Convert via Canvas (browser-only; skipped during jsdom tests).
    const pngBytes = await convertImageToPng(bytes, mimeType)
    if (!pngBytes) return null
    return await pdfDoc.embedPng(pngBytes)
  } catch (err) {
    console.warn('tryEmbedCoverPhoto: skipping cover image (non-fatal):', err)
    return null
  }
}

/**
 * Render an arbitrary image blob to PNG bytes via the Canvas API.
 * Returns `null` when the runtime can't decode the image (jsdom test
 * environment, unsupported MIME, corrupted bytes).
 */
async function convertImageToPng(
  bytes: Uint8Array,
  mimeType: string,
): Promise<Uint8Array | null> {
  if (typeof document === 'undefined' || typeof Image === 'undefined') return null
  const objectUrl = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mimeType }))
  try {
    const img = await loadImage(objectUrl)
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth || img.width
    canvas.height = img.naturalHeight || img.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0)
    const pngBlob = await canvasToBlob(canvas)
    if (!pngBlob) return null
    return new Uint8Array(await pngBlob.arrayBuffer())
  } catch (err) {
    console.warn('convertImageToPng: decode failed (non-fatal):', err)
    return null
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    let settled = false
    // Hard 10-second cap so a hung browser decoder (rare but documented
    // on malformed AVIF/HEIC) can't deadlock the PDF generator. The
    // cover-photo path catches this rejection and skips the cover.
    const timeoutHandle = setTimeout(() => {
      if (settled) return
      settled = true
      reject(new Error('Image decode timeout'))
    }, 10_000)
    img.onload = () => {
      if (settled) return
      settled = true
      clearTimeout(timeoutHandle)
      resolve(img)
    }
    img.onerror = () => {
      if (settled) return
      settled = true
      clearTimeout(timeoutHandle)
      reject(new Error('Image decode failed'))
    }
    img.src = src
  })
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise(resolve => {
    canvas.toBlob(b => resolve(b), 'image/png')
  })
}
