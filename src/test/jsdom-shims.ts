/**
 * Global jsdom shims — registered first in `vitest.config.ts` `setupFiles`.
 *
 * jsdom is intentionally minimal; several browser APIs that components and
 * primitives rely on for positioning, focus, and motion detection are not
 * implemented. Each shim here is a no-op or default that lets components
 * mount without throwing. Tests that need specific behavior (e.g., flipping
 * `prefers-reduced-motion`) override via `vi.stubGlobal(...)` per-test.
 *
 * NOTE: This file is intentionally domain-agnostic. PDF-specific shims live
 * in `src/pdf/__tests__/fonts.setup.ts` so the coupling stays one-way: any
 * non-PDF test gets these shims, PDF tests get these plus the font fetch
 * interceptor.
 */

// ResizeObserver — reka-ui primitives (UiPopover, UiTooltip, UiTabs)
// observe element sizes at module load time. Stub at file-load (not
// beforeEach) to avoid race conditions with module-init code paths.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof ResizeObserver
}

// matchMedia default — `matches: false` for every query. Tests that need a
// specific media-query result (reduced-motion, forced-colors, etc.) override
// via `vi.stubGlobal('matchMedia', ...)` in their own setup.
if (typeof globalThis.matchMedia === 'undefined') {
  globalThis.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof matchMedia
}

// Element.scrollIntoView stub — jsdom does not implement it. UiCommand
// (Story 1.4) and other scrolling primitives call it to keep an active
// option in view. The no-op satisfies the interface; visual scroll
// behavior isn't observable under jsdom anyway.
if (
  typeof Element !== 'undefined' &&
  typeof Element.prototype.scrollIntoView !== 'function'
) {
  Element.prototype.scrollIntoView = function (): void {
    // no-op
  }
}
