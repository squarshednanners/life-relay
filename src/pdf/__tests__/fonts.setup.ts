/**
 * Global jsdom shims for the test environment.
 *
 * Registered in `vitest.config.ts` under `test.setupFiles` so every test
 * gets these automatically:
 *
 *   1. `fetch('/fonts/<file>.woff')` interceptor — `src/pdf/fonts.ts` calls
 *      `fetch` for font bytes. Under Vite (dev / build / preview) this
 *      resolves against the served origin and returns from `public/fonts/`.
 *      Under Vitest + jsdom there's no server, so we intercept and read
 *      directly from disk.
 *
 *   2. `ResizeObserver` stub — jsdom doesn't implement it. Several reka-ui
 *      primitives (UiPopover, UiTooltip, UiTabs) observe element sizes for
 *      positioning. The stub is a no-op constructor that satisfies the
 *      interface; positioning becomes static, which is fine for unit tests.
 *
 *   3. `matchMedia` default — jsdom doesn't implement it either. Individual
 *      tests can override (e.g., to flip `prefers-reduced-motion: reduce`).
 *      Default returns `matches: false` for every query.
 */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { beforeEach } from 'vitest'

// ResizeObserver — single global stub. reka-ui imports it at module load
// time in some entry points, so we install it once at file load (not in
// beforeEach) to avoid race conditions.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof ResizeObserver
}

// matchMedia default — `matches: false` for every query. Tests that need a
// specific media-query result (e.g., reduced-motion) override via
// `vi.stubGlobal('matchMedia', ...)` in their own setup.
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

const FONTS_ROOT = resolve(__dirname, '../../../public/fonts')

const originalFetch = globalThis.fetch

async function fontsFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const url = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input instanceof Request
        ? input.url
        : String(input)

  // Match `/fonts/<file>` or `http(s)://.../fonts/<file>` — the loader always
  // requests a path beginning with `/fonts/`.
  const match = url.match(/\/fonts\/([^?#]+)/)
  if (match) {
    const filename = match[1]
    const fullPath = resolve(FONTS_ROOT, filename)
    try {
      const buffer = await readFile(fullPath)
      // Build a Response that satisfies the `arrayBuffer()` contract the
      // loader uses.
      return new Response(buffer, {
        status: 200,
        headers: { 'content-type': 'font/woff' },
      })
    } catch (err) {
      return new Response(null, {
        status: 404,
        statusText: `font not found at ${fullPath}: ${String(err)}`,
      })
    }
  }

  if (originalFetch) {
    return originalFetch(input as RequestInfo, init)
  }
  throw new Error(`fetch is not available in this test environment: ${url}`)
}

// Install on every test entry. `beforeEach` (rather than top-level assignment)
// guards against tests that intentionally override `globalThis.fetch` for
// other reasons — the shim is restored before each test.
beforeEach(() => {
  globalThis.fetch = fontsFetch as typeof fetch
})
