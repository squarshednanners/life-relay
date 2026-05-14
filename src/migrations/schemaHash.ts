/**
 * Deterministic structural hash of `schemaRegistry` (Story 1.12 AC3).
 *
 * Computes a SHA-256 over every schema's shape — sectionKey, isArray,
 * field names, types, `required` flag, `displayAs`, `manualEntry`,
 * `options`, `validation` (pattern/min/max), nested `arraySchema`
 * (recursive). Pinned via `src/migrations/schemaHash.expected.json` and
 * asserted by `src/migrations/__tests__/schemaHash.test.ts`.
 *
 * Any unintentional schema change → hash mismatch → CI failure → the
 * developer is forced to either revert the change OR bump
 * `CURRENT_SCHEMA_VERSION`, add a migration, add a fixture, and update
 * the expected hash.
 *
 * The hash is sensitive to FIELD DECLARATION ORDER inside each schema —
 * re-ordering fields changes PDF rendering + form layout, which is
 * user-visible, so a re-order requires a deliberate hash bump too.
 *
 * Excludes: `title` (UI copy, not data shape — renaming "People" to
 * "People & Contacts" shouldn't trip the gate), `pdfLabel`,
 * `pdfFormat`, `optionsFrom` (runtime callback, not deterministically
 * serializable), `dependsOn`, `componentProps`, `placeholder`, `helpText`.
 */

import { schemaRegistry } from '@/schemas'
import type { FormFieldSchema, FormSectionSchema } from '@/models/FormSchema'

/**
 * Canonicalize one field into a minimal structural descriptor. Includes
 * only properties that affect the data CONTRACT (what values are valid +
 * what shape the stored data takes), not UI copy or runtime callbacks.
 *
 * `visited` tracks already-canonicalized sections so recursive
 * `arraySchema` references can't cause an infinite loop (stack overflow).
 */
function canonField(
  field: FormFieldSchema,
  visited: Set<FormSectionSchema>,
): unknown {
  const out: Record<string, unknown> = {
    name: field.name ?? null,
    type: field.type ?? null,
  }
  if (field.required) out.required = true
  if (field.displayAs) out.displayAs = field.displayAs
  if (field.manualEntry) out.manualEntry = true
  // `options` affects the set of valid stored values for select/radio
  // fields — changing them is a data-contract change.
  if (field.options) {
    out.options = field.options.map(o => ({ label: o.label, value: o.value }))
  }
  // `validation` constraints (pattern/min/max) define what data the
  // schema rejects — also part of the contract.
  if (field.validation) {
    const v: Record<string, unknown> = {}
    if (field.validation.pattern !== undefined) v.pattern = field.validation.pattern
    if (field.validation.min !== undefined) v.min = field.validation.min
    if (field.validation.max !== undefined) v.max = field.validation.max
    if (Object.keys(v).length > 0) out.validation = v
  }
  if (field.arraySchema) {
    out.arraySchema = canonSection(field.arraySchema, visited)
  }
  return out
}

function canonSection(
  schema: FormSectionSchema,
  visited: Set<FormSectionSchema>,
): unknown {
  if (visited.has(schema)) {
    throw new Error(
      `Schema cycle detected at sectionKey="${schema.sectionKey}". A section's arraySchema (transitively) refers back to itself.`,
    )
  }
  visited.add(schema)
  try {
    return {
      sectionKey: schema.sectionKey,
      // `title` is UI copy — NOT part of the data contract. Excluded so
      // a cosmetic rename ("People" → "People & Contacts") doesn't trip
      // the hash gate.
      isArray: schema.isArray ?? false,
      // Field DECLARATION order is part of the contract — preserve it.
      fields: schema.fields.map(f => canonField(f, visited)),
    }
  } finally {
    visited.delete(schema)
  }
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value)
}

function buildPayload(
  registry: Record<string, FormSectionSchema> = schemaRegistry,
): string {
  const sectionKeys = Object.keys(registry).sort()
  const visited = new Set<FormSectionSchema>()
  const canonical = sectionKeys.map(key => canonSection(registry[key], visited))
  return canonicalJson(canonical)
}

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Compute the deterministic SHA-256 hash over the schema registry shape.
 * Defaults to the live `schemaRegistry`; tests can pass a stub.
 *
 * Uses Web Crypto (`crypto.subtle.digest`) — available in modern browsers
 * AND Node 20+ (vitest's runtime).
 */
export async function computeSchemaHash(
  registry?: Record<string, FormSectionSchema>,
): Promise<string> {
  const payload = buildPayload(registry)
  const bytes = new TextEncoder().encode(payload)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return toHex(digest)
}
