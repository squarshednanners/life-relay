/**
 * PDF font loader — embeds the 6 typeface roles required by every generated PDF.
 *
 * Maps each role declared in `tokens.pdfFont` to a static-instance WOFF subset
 * shipped from `public/fonts/`. Calling `embedPdfFonts(pdfDoc)`:
 *   1. Registers `@pdf-lib/fontkit` on the document (idempotent per doc).
 *   2. Loads each WOFF file via `fetch` (browser) or the test shim (jsdom).
 *   3. Embeds each font with `{ subset: true }` so only glyphs actually drawn
 *      end up in the PDF.
 *
 * Module-level cache keys raw byte buffers by URL so repeated calls in the
 * same session don't re-download. PDF embedding itself must run per-document
 * (each `PDFDocument` has its own font table).
 *
 * Why WOFF and not TTF: the `@fontsource/*` npm packages we depend on ship
 * WOFF + WOFF2 subsets, not TTF. `@pdf-lib/fontkit` (fontkit 1.x) decodes
 * uncompressed WOFF natively, so we ship the .woff variant. The latin-only
 * subset shipped by @fontsource keeps each file at ~25-31KB.
 */
import { PDFDocument, type PDFFont } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { pdfFont } from '@/tokens'

export type PdfFontRole = keyof typeof pdfFont

export type PdfFontSet = Record<PdfFontRole, PDFFont>

/**
 * Maps role identifiers to their on-disk WOFF filenames. Filenames follow the
 * convention declared in the Story 1.2 spec (`<Family>-<Weight>.woff`) so
 * `public/fonts/` is greppable.
 */
const FONT_URLS: Record<PdfFontRole, string> = {
  headingRegular: '/fonts/SourceSerif4-Regular.woff',
  headingMedium: '/fonts/SourceSerif4-Medium.woff',
  headingItalic: '/fonts/SourceSerif4-Italic.woff',
  bodyRegular: '/fonts/Inter-Regular.woff',
  bodyMedium: '/fonts/Inter-Medium.woff',
  monoRegular: '/fonts/JetBrainsMono-Regular.woff',
}

const byteCache = new Map<string, Promise<ArrayBuffer>>()

async function loadFontBytes(url: string): Promise<ArrayBuffer> {
  let cached = byteCache.get(url)
  if (!cached) {
    cached = fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `PDF font fetch failed (${response.status}): ${url}`,
          )
        }
        return response.arrayBuffer()
      })
      .catch((err) => {
        // Don't poison the cache with a rejected promise — a transient
        // failure (network blip, missed deploy file) would otherwise break
        // every subsequent PDF generation in the session until reload.
        byteCache.delete(url)
        throw err
      })
    byteCache.set(url, cached)
  }
  return cached
}

/**
 * Loads + embeds the full `PdfFontSet` on the given document. Must be awaited
 * before any `page.drawText` call that uses a custom font.
 */
export async function embedPdfFonts(pdfDoc: PDFDocument): Promise<PdfFontSet> {
  pdfDoc.registerFontkit(fontkit)

  const entries = await Promise.all(
    (Object.entries(FONT_URLS) as Array<[PdfFontRole, string]>).map(
      async ([role, url]) => {
        const bytes = await loadFontBytes(url)
        const font = await pdfDoc.embedFont(bytes, { subset: true })
        return [role, font] as const
      },
    ),
  )

  return Object.fromEntries(entries) as PdfFontSet
}

/**
 * Test-only: reset the byte cache. Generators in production never call this;
 * tests call it between cases to verify fetch behavior under different shims.
 */
export function _resetFontCache(): void {
  byteCache.clear()
}
