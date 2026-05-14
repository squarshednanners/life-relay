# Schema Migration Framework

Story 1.12. This directory holds the migration runtime, the schema-hash CI gate, and the registry that future schema authors append to whenever the `DeathboxData` shape changes.

## When to bump `CURRENT_SCHEMA_VERSION`

Bump the version on **any** change to the serialized shape of `DeathboxData` or any field schema. Examples that REQUIRE a bump:

- Renaming a field (`firstName` → `givenName`)
- Changing a field's type (`type: 'text'` → `type: 'number'`)
- Adding a NEW required field that existing vaults don't have
- Restructuring a nested array (`multiSigConfig.keys` → `multiSigConfig.signers`)
- Re-ordering schema fields (PDF rendering depends on declaration order)

Examples that DO NOT require a bump:

- Tweaking a label or description (cosmetic)
- Adding an optional field that's safe to be missing (existing vaults don't gain it; the renderer treats `undefined` as empty)
- Changing token-bound styling (no data implication)

When in doubt: bump it. A no-op migration (`migrate: data => data`) plus a fixture refresh is cheap. Silent data corruption is not.

## How to write a migration

Migrations are **pure functions** from the old shape to the new shape:

```ts
import type { SchemaMigration } from './index'

const v1tov2: SchemaMigration = {
  fromVersion: 1,
  toVersion: 2,
  migrate: data => {
    // The input is a deep clone — safe to mutate. Just return the
    // transformed data. No IO. No `useLegacyStore()`. No fetch.
    return {
      ...data,
      people: (data.people ?? []).map((p: any) => ({
        // Example: rename `firstName` → `givenName`.
        givenName: p.firstName,
        lastName: p.lastName,
        // ...other fields preserved
        ...p,
      })),
    }
  },
}
```

The framework automatically sets `data.schemaVersion = toVersion` on the result, so you don't have to.

## The 4-step checklist (mandatory on every schema bump)

1. **Bump `CURRENT_SCHEMA_VERSION`** in `src/migrations/index.ts`.
2. **Append a `SchemaMigration` entry to `MIGRATIONS`** (the array in the same file). Migrations are ordered; never insert in the middle.
3. **Add `tests/fixtures/v<oldVersion>.json`** — a representative vault at the OLD shape, so the validity guard has an input to migrate.
4. **Regenerate `src/migrations/schemaHash.expected.json`** — run `npx vitest run schemaHash`, copy the new hash from the assertion failure, paste it into the JSON file. Re-run the test to confirm it passes.

If any step is missed, the CI test fails with a clear message pointing at the next action.

## Why three guards

Each guard catches a different failure class:

| Guard | What it catches | Test file |
|---|---|---|
| **1 — validity** | A migration produces invalid data (missing required field, wrong shape) | `__tests__/migrations.test.ts` |
| **2 — round-trip** | A migration breaks the export/import contract for the current version | `__tests__/migrations.test.ts` |
| **3 — hash pin** | Schema shape changed without bumping version + adding migration | `__tests__/schemaHash.test.ts` |

## What's NOT in scope for v1

- **Pre-migration rollback row** + automatic restore on migration failure: owned by Story 1.13.
- **Idempotency property test** (`migrate(migrate(x)) deepEquals migrate(x)`): also Story 1.13.
- **In-app migration progress UI**: deferred; migrations are fast for current data sizes.
- **Cross-device migration coordination**: Premium / cloud-sync territory.

## Common pitfalls

- **Don't reach for `useLegacyStore()` inside a migration.** Migrations run during `LocalDataStore.load()` BEFORE the store is populated. The store doesn't exist yet.
- **Don't add async work.** `runMigrations` is synchronous. If you need to derive data (e.g., parsing a date string), do it in pure JS. No `await fetch`, no IndexedDB reads.
- **Don't mutate the input outside the migration's return value.** The framework deep-clones, so mutation is invisible — but it's still confusing. Return a new object explicitly.
- **Don't skip the fixture step.** A migration without a fixture has no test coverage. The hash pin catches the schema change; only the fixture proves the migration WORKS.

## Idempotency (Story 1.13)

Every migration must be **idempotent** — running it twice produces the same result as running it once:

```ts
migrate(migrate(x, n), n) deepEquals migrate(x, n)
```

Why this matters: a partial-write retry (network blip, browser crash mid-write, etc.) could re-run a migration on already-migrated data. A non-idempotent migration would double-apply the transformation (e.g., renaming `firstName` → `givenName` twice would leave `givenName: undefined` since the second pass finds no `firstName`).

The test harness in `__tests__/migrations.test.ts` loops over every entry in `MIGRATIONS` and asserts idempotency automatically. If you add a migration that isn't idempotent, the test fails before merge.

**Patterns that are idempotent by default:**
- `{ ...data, newField: derived(data) }` — adding a field; running twice computes the same value
- `{ ...data, fieldRenamed: data.fieldRenamed ?? data.fieldOld, fieldOld: undefined }` — rename with self-check; the second run sees the already-renamed shape and the `??` falls back to itself

**Patterns that are NOT idempotent (avoid):**
- `data.people.push(newRow)` — appends every run
- `data.value = data.value + 1` — increments every run
- Anything that depends on the migration not having run yet

## Rollback (Story 1.13)

The framework writes a pre-migration snapshot to a `rollback` table BEFORE running any migration. If the migration fails (exception OR post-migration structural validation), the framework restores from rollback and surfaces a Companion Voice modal — the user's data is never silently corrupted.

If even the rollback row is missing (corrupt IndexedDB), the app hard-refuses and prompts the user to import their last encrypted JSON backup. This is the worst-case path — a user who never exported a backup has no recovery option, so encourage backups elsewhere in the UI.
