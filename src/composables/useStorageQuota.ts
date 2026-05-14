import { ref, readonly, watch } from 'vue'

/**
 * Browser-storage quota state machine (Story 1.8).
 *
 * Polls `navigator.storage.estimate()` to surface a soft warning at 80% of
 * the per-origin quota and a hard block at 99%. The hard block can also
 * be force-tripped via `markFull()` from the save-error path (when
 * IndexedDB rejects a write with `QuotaExceededError`).
 *
 * Singleton — module-scoped refs ensure the banner + modal + save-error
 * path all see the same state. The auto-poll interval is installed once
 * on first consumer.
 */

export type StorageQuotaState = 'unknown' | 'ok' | 'warning' | 'full'

const STORAGE_WARNING_THRESHOLD = 0.8
const STORAGE_FULL_THRESHOLD = 0.99
const REFRESH_INTERVAL_MS = 60_000

const state = ref<StorageQuotaState>('unknown')
const usagePercent = ref<number | null>(null)
const dismissedThisSession = ref(false)
let intervalHandle: ReturnType<typeof setInterval> | null = null
let visibilityListener: (() => void) | null = null

/**
 * Re-poll `navigator.storage.estimate()` and recompute state. Safe to call
 * any time; rate-limiting is the caller's responsibility (the auto-poll
 * limits itself to every REFRESH_INTERVAL_MS).
 */
async function refresh(): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return
  }
  try {
    const estimate = await navigator.storage.estimate()
    const usage = estimate.usage ?? 0
    const quota = estimate.quota ?? 0
    // Defensive: some browsers report NaN/negative/Infinity under
    // private-browsing or unusual storage pressure. Treat any
    // non-finite or out-of-range value as 'unknown' rather than letting
    // it silently flip thresholds (NaN comparisons return false for
    // every operator, which would mask real issues).
    if (
      !Number.isFinite(usage) ||
      !Number.isFinite(quota) ||
      usage < 0 ||
      quota <= 0
    ) {
      state.value = 'unknown'
      usagePercent.value = null
      return
    }
    const ratio = usage / quota
    usagePercent.value = Math.round(ratio * 100)
    if (ratio >= STORAGE_FULL_THRESHOLD) {
      state.value = 'full'
    } else if (ratio >= STORAGE_WARNING_THRESHOLD) {
      state.value = 'warning'
    } else {
      state.value = 'ok'
    }
  } catch (err) {
    console.error('useStorageQuota: navigator.storage.estimate() threw', err)
    state.value = 'unknown'
    usagePercent.value = null
  }
}

/**
 * Forcibly flip state to 'full'. Used by `LocalDataStore.save()` when
 * IndexedDB rejects with QuotaExceededError. Subsequent acknowledgements
 * trigger a refresh — if the user has freed space in the meantime, state
 * will drop back to 'warning' or 'ok' and the modal won't re-open.
 */
function markFull(): void {
  state.value = 'full'
}

function dismissBanner(): void {
  dismissedThisSession.value = true
}

/**
 * Reset the per-session banner dismissal when state leaves 'warning' —
 * if the user crosses back over 80% later in the same session, the
 * banner should re-show.
 */
watch(state, (next, prev) => {
  if (prev === 'warning' && next !== 'warning') {
    dismissedThisSession.value = false
  }
})

/**
 * Composable accessor. First call installs the auto-poll interval + an
 * immediate refresh; subsequent calls share the same singleton state.
 *
 * Pauses polling when the document is hidden (background tab) and forces
 * a refresh on visibility-restore so the UI is in sync after the user
 * returns to the tab.
 *
 * Tests can reset via `_resetStorageQuotaForTests()`.
 */
export function useStorageQuota() {
  if (intervalHandle === null && typeof window !== 'undefined') {
    void refresh()
    intervalHandle = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      void refresh()
    }, REFRESH_INTERVAL_MS)
    if (typeof document !== 'undefined' && visibilityListener === null) {
      visibilityListener = () => {
        if (document.visibilityState === 'visible') void refresh()
      }
      document.addEventListener('visibilitychange', visibilityListener)
    }
    // HMR cleanup so dev rebuilds don't accumulate timers + listeners
    // against orphaned module instances.
    if (typeof import.meta !== 'undefined' && import.meta.hot) {
      import.meta.hot.dispose(() => {
        if (intervalHandle !== null) {
          clearInterval(intervalHandle)
          intervalHandle = null
        }
        if (visibilityListener !== null && typeof document !== 'undefined') {
          document.removeEventListener('visibilitychange', visibilityListener)
          visibilityListener = null
        }
      })
    }
  }
  return {
    state: readonly(state),
    usagePercent: readonly(usagePercent),
    dismissedThisSession: readonly(dismissedThisSession),
    refresh,
    markFull,
    dismissBanner,
  }
}

/**
 * Test-only reset. Production code never calls this.
 */
export function _resetStorageQuotaForTests(): void {
  state.value = 'unknown'
  usagePercent.value = null
  dismissedThisSession.value = false
  if (intervalHandle !== null) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
  if (visibilityListener !== null && typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', visibilityListener)
    visibilityListener = null
  }
}
