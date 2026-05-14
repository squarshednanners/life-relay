/**
 * manualEntry PDF contract (Story 1.11).
 *
 * When a schema field has `manualEntry: true` AND the user's data carries
 * `${name}ManualEntry: true`, the rendered PDF must substitute the stored
 * value with a blank handwriting line — the secret never reaches the
 * printed page. When the flag is false (default), the stored value
 * renders normally.
 *
 * This test pins both directions for the full-vault PDF (`generator.ts`
 * via `schemaToPdf.ts`) using a representative `passwordVaults` fixture
 * with a known sentinel password. The text-layer assertion goes through
 * `pdfjs-dist` so we're checking what actually lands in the PDF, not
 * just the calls made into pdf-lib.
 *
 * Also pins single-source-of-truth: every PDF generator that handles
 * manualEntry imports the constant from `src/pdf/manualEntry.ts` rather
 * than inlining an underscore literal.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import {
  getDocument,
  GlobalWorkerOptions,
} from 'pdfjs-dist/legacy/build/pdf.mjs'

const requireFromHere = createRequire(import.meta.url)
GlobalWorkerOptions.workerSrc = pathToFileURL(
  requireFromHere.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs'),
).href

import { generatePDFDocument } from '../generator'
import { MANUAL_ENTRY_BLANK_PLACEHOLDER } from '../manualEntry'
import type { DeathboxData } from '@/models/DeathboxData'

const SECRET_SENTINEL = 'do-not-print-this-secret-2026'

function buildFixture(opts: { manualEntry: boolean }): DeathboxData {
  // Minimum viable vault with a passwordVaults entry whose
  // masterPassword carries the sentinel. The per-item ManualEntry flag
  // controls whether the PDF should print the value or a blank line.
  return {
    schemaVersion: 1,
    updatedAt: '2026-05-13T12:00:00.000Z',
    passwordVaults: [
      {
        id: 'pv1',
        vaultName: 'Test 1Password',
        accessUrl: 'https://1password.com',
        username: 'test@example.com',
        masterPassword: SECRET_SENTINEL,
        masterPasswordManualEntry: opts.manualEntry,
      },
    ],
  } as unknown as DeathboxData
}

async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const loadingTask = getDocument({
    data: bytes,
    disableWorker: true,
    isEvalSupported: false,
  })
  const pdf = await loadingTask.promise
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const tc = await page.getTextContent()
    pages.push(
      tc.items
        .map((it: unknown) =>
          typeof it === 'object' && it !== null && 'str' in it
            ? String((it as { str: string }).str)
            : '',
        )
        .join(' '),
    )
  }
  return pages.join(' \n ')
}

describe('manualEntry — PDF blank-line contract', () => {
  it('replaces the stored value with the placeholder when manualEntry flag is true', async () => {
    const bytes = await generatePDFDocument(buildFixture({ manualEntry: true }))
    const text = await extractPdfText(bytes)
    expect(text).not.toContain(SECRET_SENTINEL)
    expect(text).toContain(MANUAL_ENTRY_BLANK_PLACEHOLDER)
  })

  it('renders the stored value when manualEntry flag is false', async () => {
    const bytes = await generatePDFDocument(buildFixture({ manualEntry: false }))
    const text = await extractPdfText(bytes)
    expect(text).toContain(SECRET_SENTINEL)
    // The placeholder should NOT appear anywhere (no other manualEntry
    // field in this minimal fixture).
    expect(text).not.toContain(MANUAL_ENTRY_BLANK_PLACEHOLDER)
  })
})

describe('manualEntry — single source of truth across generators', () => {
  // Every PDF generator that handles manualEntry MUST import the
  // placeholder from `manualEntry.ts` rather than inlining an underscore
  // literal. This grep guards against future regressions where a new
  // generator (or refactor) introduces a different placeholder string
  // and breaks visual consistency.
  const GENERATOR_PATHS = [
    'src/pdf/generator.ts', // imports indirectly via schemaToPdf.ts
    'src/pdf/schemaToPdf.ts',
    'src/pdf/emergencySheet.ts',
    'src/pdf/attorneyPrepPdf.ts',
    'src/pdf/runbookPdf.ts',
    'src/pdf/walletCardPdf.ts',
  ]
  // Match 8+ consecutive underscores — that's the visual signature of an
  // inline blank-line literal we want to ban. Shorter underscore runs
  // (e.g., variable names) are unaffected.
  const INLINE_UNDERSCORE_LITERAL = /['"]_{8,}/

  for (const relPath of GENERATOR_PATHS) {
    it(`${relPath} does not inline a hardcoded underscore placeholder`, () => {
      const fullPath = resolve(__dirname, '../../..', relPath)
      const src = readFileSync(fullPath, 'utf-8')
      // The `manualEntry.ts` constant declaration itself is allowed
      // because that's where the canonical value lives.
      if (relPath === 'src/pdf/manualEntry.ts') return
      expect(src).not.toMatch(INLINE_UNDERSCORE_LITERAL)
    })
  }
})
