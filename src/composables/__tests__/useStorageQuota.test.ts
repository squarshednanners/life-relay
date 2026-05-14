/**
 * useStorageQuota state machine tests (Story 1.8 AC7).
 *
 * Verifies threshold transitions, the markFull force-trip path, the
 * dismissed-this-session flag, and the graceful degradation when
 * `navigator.storage.estimate` is unavailable.
 *
 * The composable is a module-scoped singleton; `_resetStorageQuotaForTests`
 * clears the state between tests.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  useStorageQuota,
  _resetStorageQuotaForTests,
} from '../useStorageQuota'

function stubEstimate(usage: number, quota: number) {
  vi.stubGlobal('navigator', {
    ...globalThis.navigator,
    storage: {
      estimate: () => Promise.resolve({ usage, quota }),
    },
  })
}

beforeEach(() => {
  _resetStorageQuotaForTests()
})

afterEach(() => {
  vi.unstubAllGlobals()
  _resetStorageQuotaForTests()
})

describe('useStorageQuota', () => {
  it('transitions to "ok" when usage is below 80%', async () => {
    stubEstimate(500_000, 1_000_000) // 50% used
    const q = useStorageQuota()
    await q.refresh()
    expect(q.state.value).toBe('ok')
    expect(q.usagePercent.value).toBe(50)
  })

  it('transitions to "warning" at 80% threshold', async () => {
    stubEstimate(800_000, 1_000_000) // exactly 80%
    const q = useStorageQuota()
    await q.refresh()
    expect(q.state.value).toBe('warning')
    expect(q.usagePercent.value).toBe(80)
  })

  it('transitions to "full" at 99% threshold', async () => {
    stubEstimate(995_000, 1_000_000) // 99.5%
    const q = useStorageQuota()
    await q.refresh()
    expect(q.state.value).toBe('full')
  })

  it('markFull() flips state synchronously', () => {
    const q = useStorageQuota()
    expect(q.state.value).toBe('unknown')
    q.markFull()
    expect(q.state.value).toBe('full')
  })

  it('stays "unknown" when navigator.storage is unavailable', async () => {
    vi.stubGlobal('navigator', {
      ...globalThis.navigator,
      storage: undefined,
    })
    const q = useStorageQuota()
    await q.refresh()
    expect(q.state.value).toBe('unknown')
    expect(q.usagePercent.value).toBeNull()
  })

  it('stays "unknown" when estimate returns quota: 0', async () => {
    stubEstimate(100, 0) // UA didn't report quota — guard against divide-by-zero
    const q = useStorageQuota()
    await q.refresh()
    expect(q.state.value).toBe('unknown')
    expect(q.usagePercent.value).toBeNull()
  })

  it('stays "unknown" when estimate throws', async () => {
    vi.stubGlobal('navigator', {
      ...globalThis.navigator,
      storage: {
        estimate: () => Promise.reject(new Error('boom')),
      },
    })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const q = useStorageQuota()
    await q.refresh()
    expect(q.state.value).toBe('unknown')
    consoleSpy.mockRestore()
  })

  it('dismissBanner() flips the per-session flag', () => {
    const q = useStorageQuota()
    expect(q.dismissedThisSession.value).toBe(false)
    q.dismissBanner()
    expect(q.dismissedThisSession.value).toBe(true)
  })

  it('refresh() updates state when usage shifts', async () => {
    stubEstimate(500_000, 1_000_000) // 50%
    const q = useStorageQuota()
    await q.refresh()
    expect(q.state.value).toBe('ok')

    stubEstimate(850_000, 1_000_000) // 85%
    await q.refresh()
    expect(q.state.value).toBe('warning')

    stubEstimate(999_000, 1_000_000) // 99.9%
    await q.refresh()
    expect(q.state.value).toBe('full')
  })
})
