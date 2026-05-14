/**
 * UiCommand smoke tests (Story 1.4 AC6 + AC9).
 *
 * Asserts the consumer-facing contract: open/close via useCommandPalette,
 * keyboard navigation, Enter execution, Escape close, Cmd/Ctrl+K toggle,
 * empty-state copy, and an axe-core a11y check.
 *
 * Why not deep DOM inspection: the component is a single-file primitive
 * with no underlying library to test. These tests pin the behavior we
 * promise to consumers — not the implementation details.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils'
import { nextTick } from 'vue'
import axe from 'axe-core'

enableAutoUnmount(afterEach)

import UiCommand from '../UiCommand.vue'
import { useCommandPalette } from '@/composables/useCommandPalette'

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
  // Reset palette state between tests (singleton across module scope).
  useCommandPalette().close()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  document.body.innerHTML = ''
})

function fixtureItems(executed: string[] = []) {
  return [
    {
      id: 'open-vault',
      label: 'Open vault',
      group: 'Navigation',
      onSelect: () => executed.push('open-vault'),
    },
    {
      id: 'add-person',
      label: 'Add a person',
      group: 'Records',
      hint: 'New beneficiary or contact',
      onSelect: () => executed.push('add-person'),
    },
    {
      id: 'export-pdf',
      label: 'Export full vault as PDF',
      group: 'Export',
      onSelect: () => executed.push('export-pdf'),
    },
  ]
}

function mountCommand(executed: string[] = []) {
  return mount(UiCommand, {
    props: {
      items: fixtureItems(executed),
      placeholder: 'Search commands',
      emptyLabel: 'No commands match your search',
      dialogLabel: 'Command palette',
    },
    attachTo: document.body,
  })
}

describe('UiCommand', () => {
  it('is not rendered when palette is closed', async () => {
    const wrapper = mountCommand()
    await flushPromises()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    wrapper.unmount()
  })

  it('renders dialog + input + list when palette opens', async () => {
    const wrapper = mountCommand()
    useCommandPalette().open()
    await flushPromises()
    await nextTick()

    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).toBeTruthy()
    expect(dialog?.getAttribute('aria-label')).toBe('Command palette')
    expect(document.querySelector('[role="combobox"]')).toBeTruthy()
    expect(document.querySelector('[role="listbox"]')).toBeTruthy()
    expect(document.body.textContent).toContain('Open vault')
    expect(document.body.textContent).toContain('Add a person')

    wrapper.unmount()
  })

  it('filters items by fuzzy match on the input', async () => {
    const wrapper = mountCommand()
    useCommandPalette().open()
    await flushPromises()

    const input = document.querySelector('[role="combobox"]') as HTMLInputElement
    expect(input).toBeTruthy()
    input.value = 'beneficiary'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()

    // Fuzzy match on the `hint` field ('New beneficiary or contact')
    expect(document.body.textContent).toContain('Add a person')
    expect(document.body.textContent).not.toContain('Export full vault as PDF')

    wrapper.unmount()
  })

  it('ArrowDown moves aria-activedescendant; Enter executes', async () => {
    const executed: string[] = []
    const wrapper = mountCommand(executed)
    useCommandPalette().open()
    await flushPromises()

    const input = document.querySelector('[role="combobox"]') as HTMLInputElement
    const initialActive = input.getAttribute('aria-activedescendant')
    expect(initialActive).toBeTruthy()

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await flushPromises()
    const nextActive = input.getAttribute('aria-activedescendant')
    expect(nextActive).toBeTruthy()
    expect(nextActive).not.toBe(initialActive)

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await flushPromises()
    await nextTick()

    // Palette closes after Enter
    expect(useCommandPalette().isOpen.value).toBe(false)
    expect(executed.length).toBe(1)
    // The fixture order is open-vault, add-person, export-pdf — ArrowDown
    // moved active from index 0 to 1 (add-person)
    expect(executed[0]).toBe('add-person')

    wrapper.unmount()
  })

  it('Escape closes without executing', async () => {
    const executed: string[] = []
    const wrapper = mountCommand(executed)
    useCommandPalette().open()
    await flushPromises()

    const input = document.querySelector('[role="combobox"]') as HTMLInputElement
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    await nextTick()

    expect(useCommandPalette().isOpen.value).toBe(false)
    expect(executed.length).toBe(0)

    wrapper.unmount()
  })

  it('Cmd+K toggles the palette open via global listener', async () => {
    const wrapper = mountCommand()
    await flushPromises()
    expect(useCommandPalette().isOpen.value).toBe(false)

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }),
    )
    await flushPromises()
    expect(useCommandPalette().isOpen.value).toBe(true)

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }),
    )
    await flushPromises()
    expect(useCommandPalette().isOpen.value).toBe(false)

    wrapper.unmount()
  })

  it('renders empty-state copy when filter excludes everything', async () => {
    const wrapper = mountCommand()
    useCommandPalette().open()
    await flushPromises()

    const input = document.querySelector('[role="combobox"]') as HTMLInputElement
    input.value = 'zzzzzz-no-such-thing'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()

    expect(document.body.textContent).toContain('No commands match your search')

    wrapper.unmount()
  })

  it('passes axe-core with zero serious or critical violations when open', async () => {
    const wrapper = mountCommand()
    useCommandPalette().open()
    await flushPromises()
    await nextTick()

    const results = await axe.run(document.body)
    const serious = results.violations.filter(
      v => v.impact === 'serious' || v.impact === 'critical',
    )
    if (serious.length > 0) {
      // Surface details on failure for diagnostic clarity
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
