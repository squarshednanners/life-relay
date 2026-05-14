/**
 * Structural-token CSS-variable bridge tests (Story 1.5).
 *
 * The cross-surface Witness Line contract requires the SAME values in
 * `src/tokens/index.ts` (TypeScript-side, consumed by Tailwind + pdf-lib)
 * AND in `src/assets/main.css` (CSS-variable-side, consumed by components
 * via Tailwind arbitrary-value classes like `border-l-[var(--witness-line-width)]`).
 *
 * If a token changes, the CSS variable must change with it. This test is
 * the regression net: it asserts the two surfaces agree byte-for-byte.
 *
 * Why not CSSOM evaluation: jsdom does not evaluate `:root` CSS variables
 * or `@media (forced-colors: active)` rules. The only reliable check is a
 * string-level read of the source file.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { color, spacing, witnessLine } from '@/tokens'

const MAIN_CSS_PATH = resolve(__dirname, '../main.css')
const css = readFileSync(MAIN_CSS_PATH, 'utf-8')

describe('main.css structural-token bridge', () => {
  it('declares --witness-line-width matching tokens.witnessLine.width', () => {
    const match = css.match(/--witness-line-width:\s*([^;]+);/)
    expect(match).toBeTruthy()
    expect(match![1].trim()).toBe(witnessLine.width)
  })

  it('declares --color-accent-700 matching tokens.color.accent[700]', () => {
    // The default-mode declaration (not the forced-colors override).
    // Match the FIRST `--color-accent-700:` entry which lives inside :root.
    const rootBlock = css.match(/:root\s*\{([\s\S]*?)\}/)
    expect(rootBlock).toBeTruthy()
    const match = rootBlock![1].match(/--color-accent-700:\s*([^;]+);/)
    expect(match).toBeTruthy()
    expect(match![1].trim()).toBe(color.accent['700'])
  })

  it('declares --witness-line-padding-left matching tokens.spacing.witnessLinePaddingLeft', () => {
    const match = css.match(/--witness-line-padding-left:\s*([^;]+);/)
    expect(match).toBeTruthy()
    expect(match![1].trim()).toBe(spacing.witnessLinePaddingLeft)
  })
})

describe('main.css forced-colors override', () => {
  it('declares an @media (forced-colors: active) block', () => {
    expect(css).toMatch(/@media\s*\(forced-colors:\s*active\)/)
  })

  it('overrides --color-accent-700 to Highlight inside the forced-colors block', () => {
    // Capture the forced-colors block content and assert the override
    // appears inside it (not just anywhere in the file).
    const block = css.match(
      /@media\s*\(forced-colors:\s*active\)\s*\{([\s\S]*?)\n\}/,
    )
    expect(block).toBeTruthy()
    expect(block![1]).toMatch(/--color-accent-700:\s*Highlight\s*;/)
  })
})
