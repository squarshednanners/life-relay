/**
 * WitnessSection smoke tests (Story 1.5 AC8).
 *
 * Asserts the component's rendering contract: default tag is <section>,
 * `as` prop changes the tag, slot content renders inside the wrapper, and
 * the CSS-variable-driven Tailwind classes are present on the wrapper.
 *
 * Why not snapshot tests: Tailwind class reordering is brittle to
 * snapshot. Assert on specific selectors / class substrings instead.
 *
 * Why not CSSOM checks: jsdom does not evaluate `[var(--my-var)]`
 * arbitrary-value classes; checking the wrapper's `style.borderLeftColor`
 * returns ''. The class-string presence is the correct level for unit
 * tests; visual correctness is verified manually or in browser-mode
 * follow-ups.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, enableAutoUnmount } from '@vue/test-utils'
import axe from 'axe-core'

enableAutoUnmount(afterEach)

import WitnessSection from '../WitnessSection.vue'

beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('WitnessSection', () => {
  it('renders a <div> by default (no landmark)', () => {
    // Per Story 1.6 code-review feedback: default `<section>` created an
    // unnamed landmark in every consumer (axe-core "moderate" rule).
    // Default is now `<div>` — consumers opt into landmark tags
    // explicitly via the `as` prop, and are responsible for providing
    // an accessible name (e.g., via `aria-labelledby`).
    const wrapper = mount(WitnessSection, {
      slots: { default: '<p data-testid="body">content</p>' },
    })
    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.find('[data-testid="body"]').exists()).toBe(true)
  })

  it('renders the slot content unmodified', () => {
    const wrapper = mount(WitnessSection, {
      slots: { default: '<div data-testid="slot">Hello vault</div>' },
    })
    expect(wrapper.find('[data-testid="slot"]').text()).toBe('Hello vault')
  })

  it('changes the wrapper tag when `as` prop is provided', () => {
    const article = mount(WitnessSection, {
      props: { as: 'article' },
      slots: { default: '<span>x</span>' },
    })
    expect(article.element.tagName).toBe('ARTICLE')

    const aside = mount(WitnessSection, {
      props: { as: 'aside' },
      slots: { default: '<span>x</span>' },
    })
    expect(aside.element.tagName).toBe('ASIDE')

    const div = mount(WitnessSection, {
      props: { as: 'div' },
      slots: { default: '<span>x</span>' },
    })
    expect(div.element.tagName).toBe('DIV')
  })

  it('applies the CSS-variable-driven witness-line classes', () => {
    const wrapper = mount(WitnessSection, {
      slots: { default: '<span>x</span>' },
    })
    const classes = wrapper.element.className
    // The arbitrary-value class strings are the contract: width, color,
    // and padding-left all reference CSS variables declared in main.css.
    expect(classes).toContain('border-l-[length:var(--witness-line-width)]')
    expect(classes).toContain('border-l-[color:var(--color-accent-700)]')
    expect(classes).toContain('pl-[var(--witness-line-padding-left)]')
  })

  it('passes axe-core with zero serious or critical violations', async () => {
    const wrapper = mount(WitnessSection, {
      slots: {
        default: '<h2>Beneficiaries</h2><p>Karen — primary beneficiary.</p>',
      },
      attachTo: document.body,
    })

    const results = await axe.run(wrapper.element)
    const serious = results.violations.filter(
      v => v.impact === 'serious' || v.impact === 'critical',
    )
    if (serious.length > 0) {
      // eslint-disable-next-line no-console
      console.error(
        'axe-core serious/critical violations:',
        JSON.stringify(
          serious.map(v => ({ id: v.id, impact: v.impact, description: v.description })),
          null,
          2,
        ),
      )
    }
    expect(serious).toEqual([])

    wrapper.unmount()
  })
})
