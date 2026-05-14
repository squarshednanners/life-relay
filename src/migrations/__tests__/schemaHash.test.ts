/**
 * Schema-hash CI gate (Story 1.12 AC3 + AC9).
 *
 * Asserts the computed hash over `schemaRegistry` matches the value
 * checked in at `src/migrations/schemaHash.expected.json`. Any
 * unintentional schema change → mismatch → CI fails with the next-step
 * checklist.
 *
 * To intentionally change the schema:
 *   1. Bump `CURRENT_SCHEMA_VERSION` in `src/migrations/index.ts`
 *   2. Append a `SchemaMigration` entry to `MIGRATIONS` covering vN → vN+1
 *   3. Add `tests/fixtures/v<old>.json` (the pre-migration shape)
 *   4. Run this test, copy the NEW hash from the assertion failure
 *      message, and paste it into `src/migrations/schemaHash.expected.json`
 *
 * See `src/migrations/README.md` for the full guide.
 */
import { describe, it, expect } from 'vitest'
import { computeSchemaHash } from '../schemaHash'
import expected from '../schemaHash.expected.json'

describe('schemaHash CI gate', () => {
  it('current schemaRegistry hash matches the pinned expected hash', async () => {
    const actual = await computeSchemaHash()
    if (actual !== expected.hash) {
      throw new Error(
        [
          '❌ Schema shape changed and the pinned hash is out of date.',
          '',
          `  Computed hash: ${actual}`,
          `  Pinned hash:   ${expected.hash}`,
          '',
          'If this change was INTENTIONAL, follow the 4-step checklist:',
          '  1. Bump `CURRENT_SCHEMA_VERSION` in src/migrations/index.ts',
          '  2. Append a `SchemaMigration` entry to `MIGRATIONS` for the new version',
          '  3. Add tests/fixtures/v<old>.json with the pre-migration shape',
          '  4. Replace `hash` in src/migrations/schemaHash.expected.json with the computed value above',
          '',
          'If this change was UNINTENTIONAL, revert it.',
          'See src/migrations/README.md for the full guide.',
        ].join('\n'),
      )
    }
    expect(actual).toBe(expected.hash)
  })

  it('hash is deterministic — repeated calls return the same value', async () => {
    const a = await computeSchemaHash()
    const b = await computeSchemaHash()
    expect(a).toBe(b)
  })

  it('hash is 64 hex chars (SHA-256)', async () => {
    const hash = await computeSchemaHash()
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })
})
