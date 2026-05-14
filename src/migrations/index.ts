/**
 * Schema migration framework (Story 1.12).
 *
 * Every change to the `DeathboxData` shape MUST:
 *   1. Bump `CURRENT_SCHEMA_VERSION` here.
 *   2. Add a `SchemaMigration` entry to `MIGRATIONS` upgrading from the
 *      previous version to the new one.
 *   3. Add a fixture at `tests/fixtures/v<previousVersion>.json` so the
 *      validity-guard test has an input.
 *   4. Regenerate `src/migrations/schemaHash.expected.json` so the
 *      hash-pin CI gate passes.
 *
 * See `src/migrations/README.md` for the full author guide.
 *
 * Migrations are pure functions: `(data) => newData`. No IO, no Vue / Pinia
 * imports, no side effects. The framework deep-clones the input before
 * each migration step (via `structuredClone` so `Date` / `Map` / `Set`
 * / `undefined` survive — JSON would silently strip them).
 */

import type { DeathboxData } from '@/models/DeathboxData'

export interface SchemaMigration {
  /** Version this migration upgrades FROM (the version on the input data). */
  fromVersion: number
  /** Version this migration upgrades TO. */
  toVersion: number
  /** Pure data transformation. No IO. Input is a deep clone — safe to mutate. */
  migrate: (data: any) => any
}

/**
 * Current canonical schema version. Bump on every shape change to
 * `DeathboxData` or any field schema that changes serialized shape.
 */
export const CURRENT_SCHEMA_VERSION = 1

/**
 * Ordered registry of every migration in the project. Append-only — older
 * migrations never disappear (they're needed to upgrade old vaults that
 * have been sitting in someone's browser for years).
 *
 * Empty today; the v1 baseline is the starting point. The first real
 * migration will be a `{ fromVersion: 1, toVersion: 2, migrate: (data) => ... }`
 * entry when the schema shape changes.
 *
 * Tests in `__tests__/rollback.test.ts` push/pop entries during runs; the
 * `validateMigrationsRegistry()` call below catches duplicate
 * `(fromVersion, toVersion)` pairs at module load.
 */
export const MIGRATIONS: SchemaMigration[] = []

/**
 * Assert at module load that MIGRATIONS has no duplicate
 * `(fromVersion, toVersion)` pairs. A duplicate would silently shadow
 * the second entry via `Array.find()` — exactly the kind of subtle
 * mistake the framework should catch loudly.
 */
function validateMigrationsRegistry(): void {
  const seen = new Set<string>()
  for (const m of MIGRATIONS) {
    const key = `${m.fromVersion}->${m.toVersion}`
    if (seen.has(key)) {
      throw new Error(
        `MIGRATIONS contains a duplicate entry for ${key} — Array.find() would silently use the first one and drop the rest.`,
      )
    }
    seen.add(key)
  }
}
validateMigrationsRegistry()

/**
 * Deep-clone preserving non-JSON-serializable values (Date, Map, Set,
 * undefined, BigInt). Falls back to JSON when structuredClone isn't
 * available (very old browsers; modern targets all support it).
 */
function safeDeepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value))
}

/**
 * Coerce `schemaVersion` to a number. Some import paths produce
 * `schemaVersion: '1'` (string), which would fail `=== 1` comparisons
 * and lead to misleading "Missing migration" errors.
 */
function coerceVersion(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 1
}

/**
 * Apply every migration needed to bring `data` from its declared
 * `schemaVersion` up to `targetVersion`. Returns the migrated data plus
 * the list of versions transitioned (empty when no migration ran).
 *
 * Throws if:
 *   - `data` is null/undefined (no data to migrate)
 *   - `data.schemaVersion > targetVersion` (cannot downgrade)
 *   - a required migration step is missing from `MIGRATIONS`
 *
 * The input is always deep-cloned before being returned (even on the
 * no-op path) so the caller's reference can't accidentally mutate the
 * stored state.
 */
export function runMigrations(
  data: any,
  targetVersion: number,
): { data: any; appliedVersions: number[] } {
  if (data === null || data === undefined) {
    throw new Error('runMigrations: data is null/undefined; nothing to migrate.')
  }

  const fromVersion = coerceVersion(data?.schemaVersion)

  if (fromVersion > targetVersion) {
    throw new Error(
      `Cannot downgrade schema: data is v${fromVersion}, target is v${targetVersion}.`,
    )
  }

  if (fromVersion === targetVersion) {
    // Clone on the no-op path too so the caller's reference is decoupled
    // from any subsequent mutation we might do (today none; future-proof).
    return { data: safeDeepClone(data), appliedVersions: [] }
  }

  let cursor: any = safeDeepClone(data)
  const applied: number[] = []
  let currentVersion = fromVersion
  while (currentVersion < targetVersion) {
    const step = MIGRATIONS.find(
      m => m.fromVersion === currentVersion && m.toVersion === currentVersion + 1,
    )
    if (!step) {
      throw new Error(
        `Missing migration from v${currentVersion} to v${currentVersion + 1}.`,
      )
    }
    const stepInput = safeDeepClone(cursor)
    cursor = step.migrate(stepInput)
    cursor.schemaVersion = step.toVersion
    applied.push(step.toVersion)
    currentVersion = step.toVersion
  }

  return { data: cursor as DeathboxData, appliedVersions: applied }
}
