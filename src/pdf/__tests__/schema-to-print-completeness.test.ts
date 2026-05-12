/**
 * Schema-to-print completeness contract (Story 1.2 AC5).
 *
 * For every `FormSectionSchema` in `schemaRegistry`:
 *   1. Build a fixture with one valid value per visible field.
 *   2. Compose all fixtures into one `DeathboxData`.
 *   3. Generate the full vault PDF via `generatePDFDocument(data)`.
 *   4. Extract the PDF text layer with `pdfjs-dist`.
 *   5. Assert every field's `label` (or `pdfLabel` override) appears in the
 *      concatenated text. Fields with `pdfSkipIfEmpty` AND empty fixture
 *      values are excluded.
 *
 * Catches the Posthumous-Correctness failure mode "schema gains a new field
 * but the PDF generator silently drops it" — an entire class of bugs that
 * wouldn't surface until a real user notices their printed runbook is
 * missing a field they entered.
 *
 * Worker disabled for jsdom: pdfjs-dist 5.x spawns a Worker URL that
 * jsdom can't resolve. Setting `disableWorker = true` runs the parse
 * inline; this is slow (~5s) but reliable in the test environment.
 */
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import {
  getDocument,
  GlobalWorkerOptions,
} from 'pdfjs-dist/legacy/build/pdf.mjs'

// Resolve pdfjs-dist's worker module via Node's module resolution rather
// than from `process.cwd()` — robust to vitest being invoked from a
// sub-directory (CI matrix runners, IDE test runners, `npm exec` in a
// workspace).
//
// pdfjs-dist 5.x rejects an empty workerSrc; we pass an absolute file://
// URL to the bundled worker, and pdfjs uses the inline fake-worker path
// under jsdom (no real Worker global available; `disableWorker: true` is
// also set per-document below).
const requireFromHere = createRequire(import.meta.url)
GlobalWorkerOptions.workerSrc = pathToFileURL(
  requireFromHere.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs'),
).href
import { generatePDFDocument } from '../generator'
import { schemaRegistry } from '@/schemas'
import type {
  DeathboxData,
} from '@/models/DeathboxData'
import type {
  FormFieldSchema,
  FormSectionSchema,
} from '@/models/FormSchema'

interface ExpectedFieldLabel {
  sectionKey: string
  fieldName: string
  label: string
}

function fixtureValueFor(field: FormFieldSchema): unknown {
  if (!field.type) return undefined
  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'email':
    case 'tel':
    case 'password':
      return `X-${field.name}`
    case 'number':
    case 'currency':
      return 1
    case 'date':
      return '2026-01-15'
    case 'checkbox':
      return true
    case 'select':
    case 'radio': {
      const opt = field.options?.find((o) => o.value !== '')
      return opt?.value ?? ''
    }
    case 'custom':
      return `X-${field.name}`
    case 'array':
      // Nested-array wrappers — handled separately by `buildItemFixture`;
      // their value comes from `arraySchema`, not from a primitive default.
      return undefined
    default: {
      // Surface schema drift loudly — if a new `FieldType` is added to
      // FormSchema.ts, the fixture builder must be extended explicitly.
      // Without this throw, missing labels would look like a renderer bug.
      const _exhaustive: never = field.type
      throw new Error(
        `schema-to-print-completeness fixtureValueFor: unhandled field type ${String(_exhaustive)} (field name: ${field.name ?? 'unnamed'})`,
      )
    }
  }
}

function buildSectionFixture(schema: FormSectionSchema): unknown {
  if (schema.isArray) {
    // One element with all fields populated.
    return [buildItemFixture(schema)]
  }
  // Singleton — special-case nested shapes.
  if (schema.sectionKey === 'lifeInsurance.policies') {
    return undefined // handled by setting data.lifeInsurance.policies separately
  }
  return buildItemFixture(schema)
}

function buildItemFixture(schema: FormSectionSchema): Record<string, unknown> {
  const item: Record<string, unknown> = {}
  if (schema.isArray) {
    item.id = `${schema.sectionKey}-1`
  }
  for (const field of schema.fields) {
    if (!field.name || !field.type) continue
    const v = fixtureValueFor(field)
    if (v !== undefined) item[field.name] = v
  }
  return item
}

function collectExpectedLabels(): ExpectedFieldLabel[] {
  const expected: ExpectedFieldLabel[] = []
  for (const schema of Object.values(schemaRegistry)) {
    for (const field of schema.fields) {
      if (!field.name || !field.type || !field.label) continue
      // Skip fields that depend on conditional visibility — the simple fixture
      // builder doesn't satisfy arbitrary `visible` predicates, so we'd assert
      // on labels for hidden fields.
      if (field.visible) continue
      // Skip nested-array wrappers. The PDF renderer renders each array
      // item's fields, but the wrapper field's own label (e.g., `petCare.pets`
      // → "Pets") is intentionally not drawn — the items themselves carry
      // visible identity. Treating this as a "missing label" produces a
      // false positive.
      if (field.type === 'array') continue
      // Skip if pdfSkipIfEmpty AND fixture value would be empty/false. The
      // simple fixture builder produces non-empty values for everything, so
      // pdfSkipIfEmpty effectively never fires here — but `checkbox: false`
      // would. The select/radio fields default to first non-empty option;
      // if no option qualifies, the value is '' and we should skip.
      const fixtureVal = fixtureValueFor(field)
      if (field.pdfSkipIfEmpty && (fixtureVal === '' || fixtureVal === false || fixtureVal === 0)) continue
      const label = field.pdfLabel ?? field.label
      expected.push({
        sectionKey: schema.sectionKey,
        fieldName: field.name,
        label,
      })
    }
  }
  return expected
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

function buildFullVaultFixture(): DeathboxData {
  const data: Record<string, unknown> = {
    schemaVersion: 1,
    updatedAt: '2026-05-12T12:00:00.000Z',
  }
  for (const schema of Object.values(schemaRegistry)) {
    if (schema.sectionKey === 'lifeInsurance.policies') continue
    const fixture = buildSectionFixture(schema)
    if (fixture !== undefined) {
      data[schema.sectionKey] = fixture
    }
  }
  // lifeInsurance is a special nested shape: { policies: [...] }
  const policySchema = schemaRegistry['lifeInsurance.policies'] as
    | FormSectionSchema
    | undefined
  if (policySchema) {
    data.lifeInsurance = {
      policies: [buildItemFixture(policySchema)],
    }
  }
  return data as DeathboxData
}

describe('schema-to-print completeness', () => {
  it('every visible field label appears in the rendered PDF text layer', async () => {
    const data = buildFullVaultFixture()
    const bytes = await generatePDFDocument(data)
    const text = await extractPdfText(bytes)

    const expected = collectExpectedLabels()
    const missing: ExpectedFieldLabel[] = expected.filter(
      (e) => !text.includes(e.label),
    )

    if (missing.length > 0) {
      const summary = missing
        .slice(0, 20)
        .map((m) => `  - [${m.sectionKey}.${m.fieldName}] label "${m.label}"`)
        .join('\n')
      const more = missing.length > 20 ? `\n  ... and ${missing.length - 20} more` : ''
      throw new Error(
        `${missing.length} of ${expected.length} expected field labels are missing from the rendered PDF:\n${summary}${more}`,
      )
    }

    expect(missing).toEqual([])
  }, 60_000)
})
