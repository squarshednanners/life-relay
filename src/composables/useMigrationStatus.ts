import { ref, readonly } from 'vue'

/**
 * Migration outcome state (Story 1.13).
 *
 *   ok                     — no migration was needed, or one ran successfully
 *   rolled-back            — migration failed; the framework restored from the
 *                            rollback row + threw MigrationFailedError. The
 *                            soft-failure modal surfaces.
 *   requires-manual-import — migration failed AND the rollback row was
 *                            missing/broken. The hard-refuse full-screen
 *                            surface mounts and the user must import a
 *                            backup before continuing.
 */
export type MigrationState = 'ok' | 'rolled-back' | 'requires-manual-import'

const state = ref<MigrationState>('ok')
const reason = ref<string | null>(null)

function markRolledBack(detail?: string): void {
  state.value = 'rolled-back'
  reason.value = detail ?? null
}

function markRequiresManualImport(detail?: string): void {
  state.value = 'requires-manual-import'
  reason.value = detail ?? null
}

/**
 * Acknowledge the soft-failure modal. Resets state to 'ok' so the modal
 * closes. The hard-refuse state cannot be acknowledged this way —
 * `clearRequiresManualImport()` is the only path out, and the caller
 * must have already proved a successful subsequent load (otherwise the
 * full-screen surface should keep blocking).
 */
function acknowledge(): void {
  if (state.value === 'rolled-back') {
    state.value = 'ok'
    reason.value = null
  }
}

/**
 * Clear the 'requires-manual-import' state. Call this ONLY after a
 * successful manual import + reload — typically from the
 * `NeedsManualImport` surface's success handler after the imported data
 * has been verified and saved. Without this exit, the surface would
 * stay mounted forever even after a successful recovery (P20).
 */
function clearRequiresManualImport(): void {
  if (state.value === 'requires-manual-import') {
    state.value = 'ok'
    reason.value = null
  }
}

/**
 * Singleton accessor — banner, modal, full-screen surface, and the
 * Pinia loadData action all read the same state.
 */
export function useMigrationStatus() {
  return {
    state: readonly(state),
    reason: readonly(reason),
    markRolledBack,
    markRequiresManualImport,
    acknowledge,
    clearRequiresManualImport,
  }
}

/**
 * Test-only reset. Production code never calls this.
 */
export function _resetMigrationStatusForTests(): void {
  state.value = 'ok'
  reason.value = null
}
