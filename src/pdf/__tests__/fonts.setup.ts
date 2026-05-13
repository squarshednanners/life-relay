/**
 * PDF-specific test setup — font fetch interceptor.
 *
 * Registered in `vitest.config.ts` `setupFiles` AFTER `src/test/jsdom-shims.ts`.
 * The shims file handles the domain-agnostic browser APIs (matchMedia,
 * ResizeObserver, scrollIntoView). This file owns ONLY the PDF-specific
 * shim — intercepting `fetch('/fonts/...')` so `src/pdf/fonts.ts` can load
 * its WOFF subsets under vitest's jsdom environment (no Vite dev server
 * available to serve `public/fonts/`).
 */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { beforeEach } from 'vitest'

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
