/**
 * Tier 1 wrapper smoke tests (Story 1.3 AC6).
 *
 * For each wrapper, mount with @vue/test-utils and assert the
 * consumer-facing API works: slots/props flow through, v-model open/close,
 * keyboard dismissal, focus management, reduced-motion behavior.
 *
 * Why smoke tests (not deep DOM inspection): the wrappers delegate
 * accessibility behavior to reka-ui — testing reka-ui's internals would
 * be testing the wrong layer. These tests assert the consumer contract.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'

// Auto-unmount every mounted wrapper at the end of each test. Pairs with
// `attachTo: document.body` to avoid manual `document.body.innerHTML = ''`
// after each case (which can race portal teardown).
enableAutoUnmount(afterEach)
import UiDialog from '../UiDialog.vue'
import UiPopover from '../UiPopover.vue'
import UiTabs from '../UiTabs.vue'
import UiTooltip from '../UiTooltip.vue'

// jsdom doesn't implement `matchMedia` by default; reka-ui's reduced-motion
// detection (and some focus management code paths) call it. Provide a default
// that reports "motion allowed" — individual tests can override.
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
  vi.useRealTimers()
})

describe('UiDialog', () => {
  it('renders title + description + actions slots when open', async () => {
    const wrapper = mount(UiDialog, {
      props: {
        open: true,
        title: 'Confirm action',
        description: 'This action will be witnessed.',
        closeLabel: 'Dismiss this dialog',
      },
      slots: {
        default: '<div data-testid="body">Body content</div>',
        actions: '<button data-testid="action">Continue</button>',
      },
      attachTo: document.body,
    })
    await flushPromises()

    // reka-ui Dialog renders into a portal — the dialog content ends up at
    // document.body, not inside the wrapper's local DOM. Query the document.
    expect(document.body.textContent).toContain('Confirm action')
    expect(document.body.textContent).toContain('This action will be witnessed.')
    expect(document.body.querySelector('[data-testid="body"]')).toBeTruthy()
    expect(document.body.querySelector('[data-testid="action"]')).toBeTruthy()

    wrapper.unmount()
    document.body.innerHTML = ''
  })

  it('v-model:open closes the dialog on update', async () => {
    const Host = defineComponent({
      components: { UiDialog },
      setup() {
        const open = ref(true)
        return { open }
      },
      template: `
        <UiDialog v-model:open="open" title="T" close-label="Close">
          <div data-testid="body">Body</div>
        </UiDialog>
      `,
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()

    expect(document.body.querySelector('[data-testid="body"]')).toBeTruthy()

    wrapper.vm.open = false
    await nextTick()
    await flushPromises()

    expect(document.body.querySelector('[data-testid="body"]')).toBeFalsy()

    wrapper.unmount()
    document.body.innerHTML = ''
  })

  it('Escape closes the dialog (child→parent emit path)', async () => {
    const Host = defineComponent({
      components: { UiDialog },
      setup() {
        const open = ref(true)
        return { open }
      },
      template: `
        <UiDialog v-model:open="open" title="T" close-label="Close">
          <div data-testid="body">Body</div>
        </UiDialog>
      `,
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    expect(document.body.querySelector('[data-testid="body"]')).toBeTruthy()

    // reka-ui DialogContent listens for Escape on the document. Dispatch a
    // keydown that bubbles so the listener catches it.
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    await flushPromises()
    await nextTick()

    // The wrapper's parent v-model should have flipped to false, removing
    // the dialog from the DOM.
    expect(wrapper.vm.open).toBe(false)
    expect(document.body.querySelector('[data-testid="body"]')).toBeFalsy()

    wrapper.unmount()
    document.body.innerHTML = ''
  })

  it('renders the SVG close button when closeLabel is provided', async () => {
    const wrapper = mount(UiDialog, {
      props: { open: true, title: 'T', closeLabel: 'Dismiss' },
      attachTo: document.body,
    })
    await flushPromises()

    const closeBtn = document.body.querySelector('[aria-label="Dismiss"]')
    expect(closeBtn).toBeTruthy()
    expect(closeBtn?.querySelector('svg')).toBeTruthy()

    wrapper.unmount()
    document.body.innerHTML = ''
  })
})

describe('UiPopover', () => {
  it('renders content when open', async () => {
    const wrapper = mount(UiPopover, {
      props: { open: true },
      slots: {
        trigger: '<button data-testid="trigger">Open</button>',
        default: '<div data-testid="content">Popover body</div>',
      },
      attachTo: document.body,
    })
    await flushPromises()

    expect(document.body.querySelector('[data-testid="trigger"]')).toBeTruthy()
    expect(document.body.querySelector('[data-testid="content"]')).toBeTruthy()

    wrapper.unmount()
    document.body.innerHTML = ''
  })

  it('emits update:open when toggling closed', async () => {
    const Host = defineComponent({
      components: { UiPopover },
      setup() {
        const open = ref(true)
        return { open }
      },
      template: `
        <UiPopover v-model:open="open">
          <template #trigger><button>Trigger</button></template>
          <div data-testid="body">Body</div>
        </UiPopover>
      `,
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()

    expect(document.body.querySelector('[data-testid="body"]')).toBeTruthy()

    wrapper.vm.open = false
    await nextTick()
    await flushPromises()

    expect(document.body.querySelector('[data-testid="body"]')).toBeFalsy()

    wrapper.unmount()
    document.body.innerHTML = ''
  })

  it('Escape closes the popover (child→parent emit path)', async () => {
    const Host = defineComponent({
      components: { UiPopover },
      setup() {
        const open = ref(true)
        return { open }
      },
      template: `
        <UiPopover v-model:open="open">
          <template #trigger><button>Trigger</button></template>
          <div data-testid="body">Body</div>
        </UiPopover>
      `,
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()
    expect(document.body.querySelector('[data-testid="body"]')).toBeTruthy()

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    await flushPromises()
    await nextTick()

    expect(wrapper.vm.open).toBe(false)
    expect(document.body.querySelector('[data-testid="body"]')).toBeFalsy()

    wrapper.unmount()
    document.body.innerHTML = ''
  })
})

describe('UiTabs', () => {
  const tabs = [
    { value: 'a', label: 'First' },
    { value: 'b', label: 'Second' },
    { value: 'c', label: 'Third' },
  ]

  it('renders one trigger per tab with the provided label', async () => {
    const wrapper = mount(UiTabs, {
      props: { modelValue: 'a', tabs },
      slots: {
        default: (slotProps: { value: string }) =>
          h('div', { 'data-testid': `panel-${slotProps.value}` }, `panel ${slotProps.value}`),
      },
      attachTo: document.body,
    })
    await flushPromises()

    const triggers = wrapper.findAll('[role="tab"]')
    expect(triggers.length).toBe(3)
    expect(triggers[0].text()).toBe('First')
    expect(triggers[1].text()).toBe('Second')
    expect(triggers[2].text()).toBe('Third')

    wrapper.unmount()
  })

  it('marks the active tab via aria-selected', async () => {
    const wrapper = mount(UiTabs, {
      props: { modelValue: 'b', tabs },
      slots: {
        default: () => h('div'),
      },
      attachTo: document.body,
    })
    await flushPromises()

    const triggers = wrapper.findAll('[role="tab"]')
    expect(triggers[0].attributes('aria-selected')).toBe('false')
    expect(triggers[1].attributes('aria-selected')).toBe('true')
    expect(triggers[2].attributes('aria-selected')).toBe('false')

    wrapper.unmount()
  })

  it('ArrowRight moves focus + activation to the next tab', async () => {
    const Host = defineComponent({
      components: { UiTabs },
      setup() {
        const active = ref('a')
        return { active, tabs }
      },
      template: `
        <UiTabs v-model="active" :tabs="tabs">
          <template #default="{ value }">
            <div :data-testid="'panel-' + value">{{ value }}</div>
          </template>
        </UiTabs>
      `,
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await flushPromises()

    const triggers = wrapper.findAll('[role="tab"]')
    // Activate the first trigger via focus then dispatch ArrowRight on it.
    ;(triggers[0].element as HTMLElement).focus()
    await triggers[0].trigger('keydown', { key: 'ArrowRight' })
    await flushPromises()
    await nextTick()

    // reka-ui Tabs default activation mode is 'automatic' — focus shift
    // also changes the model value.
    expect(wrapper.vm.active).toBe('b')

    wrapper.unmount()
  })

  it('emits update:modelValue when a different tab is clicked', async () => {
    const wrapper = mount(UiTabs, {
      props: { modelValue: 'a', tabs },
      slots: { default: () => h('div') },
      attachTo: document.body,
    })
    await flushPromises()

    const triggers = wrapper.findAll('[role="tab"]')
    await triggers[2].trigger('mousedown')
    await triggers[2].trigger('click')
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const lastEmit = wrapper.emitted('update:modelValue')!.at(-1)!
    expect(lastEmit[0]).toBe('c')

    wrapper.unmount()
  })
})

describe('UiTooltip', () => {
  it('renders the trigger slot', async () => {
    const wrapper = mount(UiTooltip, {
      props: { content: 'Helpful hint' },
      slots: { trigger: '<button data-testid="trigger">Hover me</button>' },
      attachTo: document.body,
    })
    await flushPromises()

    expect(document.body.querySelector('[data-testid="trigger"]')).toBeTruthy()

    wrapper.unmount()
    document.body.innerHTML = ''
  })

  it('does not render content before hover/focus (idle state)', async () => {
    const wrapper = mount(UiTooltip, {
      props: { content: 'Should not appear yet' },
      slots: { trigger: '<button>Trigger</button>' },
      attachTo: document.body,
    })
    await flushPromises()

    // Tooltip is portal-rendered AND only mounts after hover/focus + delay.
    // Idle: trigger is visible, content is not.
    expect(document.body.textContent).not.toContain('Should not appear yet')

    wrapper.unmount()
    document.body.innerHTML = ''
  })

  // Note: actual hover/focus reveal with timer advancement is not tested
  // here — reka-ui's PointerEvent + jsdom hover semantics are unreliable.
  // Coverage deferred to integration testing (real browser) when a consumer
  // surface (Story 1.4+) uses a tooltip in context.
})

describe('reduced-motion behavior', () => {
  it('matchMedia stub reporting `reduce` does not throw on Dialog mount', async () => {
    // Override the beforeEach stub for this test.
    vi.stubGlobal(
      'matchMedia',
      (query: string) => ({
        matches: query.includes('reduce'),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(() => false),
      }),
    )

    const wrapper = mount(UiDialog, {
      props: { open: true, title: 'T', closeLabel: 'Close' },
      attachTo: document.body,
    })
    await flushPromises()

    // Dialog content rendered — reduced-motion didn't break the mount.
    // The motion-safe: Tailwind variant ensures CSS transitions are
    // suppressed at the browser layer; we verify the wrapper doesn't
    // explode under the contract.
    expect(document.body.querySelector('[role="dialog"]')).toBeTruthy()

    wrapper.unmount()
    document.body.innerHTML = ''
  })
})
