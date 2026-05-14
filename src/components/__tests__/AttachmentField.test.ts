/**
 * AttachmentField smoke + interaction tests (Story 1.7, AC4 + AC13).
 */
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils'
import { IDBFactory } from 'fake-indexeddb'
import AttachmentField from '../AttachmentField.vue'
import { AttachmentStore } from '@/services/AttachmentStore'
import type { FormFieldSchema } from '@/models/FormSchema'

enableAutoUnmount(afterEach)

const baseField: FormFieldSchema = {
  name: 'documentFiles',
  label: 'Document files',
  type: 'attachment',
  multiple: true,
}

function fakeFile(bytes: number[], name = 'test.pdf', mimeType = 'application/pdf'): File {
  return new File([new Uint8Array(bytes)], name, { type: mimeType })
}

// jsdom's File doesn't implement `arrayBuffer()`, but our AttachmentStore
// already has a FileReader fallback. Tests exercise the same path.

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  await new AttachmentStore().clear()
  // URL.createObjectURL is a no-op stub by default in jsdom; provide a
  // minimal implementation so the component's blob-URL paths run.
  if (typeof URL.createObjectURL !== 'function' || URL.createObjectURL.toString().includes('throw')) {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: (_: Blob) => `blob:test/${Math.random().toString(36).slice(2)}`,
    })
  }
  if (typeof URL.revokeObjectURL !== 'function') {
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: () => undefined,
    })
  }
})

describe('AttachmentField — initial render', () => {
  it('mounts and shows the Add a file button when modelValue is empty', () => {
    const wrapper = mount(AttachmentField, {
      props: { modelValue: undefined, field: baseField },
    })
    expect(wrapper.text()).toContain('Add a file')
    expect(wrapper.text()).toContain('Document files')
  })

  it('renders metadata for pre-existing attachment ids', async () => {
    const store = new AttachmentStore()
    const meta = await store.add(fakeFile([1, 2, 3], 'will.pdf'))
    const wrapper = mount(AttachmentField, {
      props: { modelValue: [meta.id], field: baseField },
    })
    // Two flushes: one for the immediate watch firing refreshMetadata,
    // one for the metadata-driven thumbnail watch chain.
    await flushPromises()
    await flushPromises()
    await flushPromises()
    expect(wrapper.text()).toContain('will.pdf')
    expect(wrapper.text()).toContain('PDF')
  })
})

async function settle(): Promise<void> {
  // FileReader's onload callback fires on a macrotask, not a microtask.
  // flushPromises only drains microtasks. Interleave both so a multi-
  // file upload loop with FileReader-based file reads completes before
  // the test asserts.
  for (let i = 0; i < 10; i++) {
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

describe('AttachmentField — adding files', () => {
  it('appends to modelValue in multi-mode', async () => {
    const wrapper = mount(AttachmentField, {
      props: { modelValue: [], field: baseField },
    })
    const input = wrapper.find('input[type="file"]')
    expect(input.exists()).toBe(true)
    // Simulate file selection: set files property + dispatch change.
    const file = fakeFile([1, 2, 3], 'a.pdf')
    Object.defineProperty(input.element, 'files', {
      configurable: true,
      value: [file],
    })
    await input.trigger('change')
    await settle()
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(Array.isArray(emitted![0][0])).toBe(true)
    expect((emitted![0][0] as string[]).length).toBe(1)
  })

  it('emits a single string in single-mode', async () => {
    const singleField: FormFieldSchema = { ...baseField, multiple: false }
    const wrapper = mount(AttachmentField, {
      props: { modelValue: undefined, field: singleField },
    })
    const input = wrapper.find('input[type="file"]')
    const file = fakeFile([1, 2, 3], 'a.pdf')
    Object.defineProperty(input.element, 'files', { configurable: true, value: [file] })
    await input.trigger('change')
    await settle()
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(typeof emitted![0][0]).toBe('string')
  })
})

describe('AttachmentField — oversize rejection', () => {
  it('shows an error message and does not emit when a file exceeds maxSizeBytes', async () => {
    const tinyField: FormFieldSchema = { ...baseField, maxSizeBytes: 2 }
    const wrapper = mount(AttachmentField, {
      props: { modelValue: [], field: tinyField },
    })
    const input = wrapper.find('input[type="file"]')
    // 5-byte file with a 2-byte limit.
    const file = fakeFile([1, 2, 3, 4, 5], 'big.pdf')
    Object.defineProperty(input.element, 'files', { configurable: true, value: [file] })
    await input.trigger('change')
    await settle()
    expect(wrapper.text()).toMatch(/too big|limit/i)
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })
})

describe('AttachmentField — max-attachments cap (Story 1.7b)', () => {
  it('refuses upload when modelValue is already at the default cap of 10', async () => {
    // Seed 10 attachments in the store + reference them in modelValue.
    const store = new AttachmentStore()
    const ids: string[] = []
    for (let i = 0; i < 10; i++) {
      const meta = await store.add(fakeFile([i], `f${i}.pdf`))
      ids.push(meta.id)
    }
    const wrapper = mount(AttachmentField, {
      props: { modelValue: ids, field: baseField },
    })
    const input = wrapper.find('input[type="file"]')
    const eleventh = fakeFile([99], 'eleventh.pdf')
    Object.defineProperty(input.element, 'files', {
      configurable: true,
      value: [eleventh],
    })
    await input.trigger('change')
    await settle()
    expect(wrapper.text()).toMatch(/up to 10 files/i)
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('respects a custom maxAttachments value', async () => {
    const tinyCapField: FormFieldSchema = { ...baseField, maxAttachments: 2 }
    const store = new AttachmentStore()
    const a = await store.add(fakeFile([1], 'a.pdf'))
    const b = await store.add(fakeFile([2], 'b.pdf'))
    const wrapper = mount(AttachmentField, {
      props: { modelValue: [a.id, b.id], field: tinyCapField },
    })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      configurable: true,
      value: [fakeFile([3], 'c.pdf')],
    })
    await input.trigger('change')
    await settle()
    expect(wrapper.text()).toMatch(/up to 2 files/i)
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('partially accepts a batch when the cap is mid-batch', async () => {
    const store = new AttachmentStore()
    const existing = await store.add(fakeFile([1], 'existing.pdf'))
    // Cap = 3, already at 1 → only 2 more allowed; submit 4.
    const capField: FormFieldSchema = { ...baseField, maxAttachments: 3 }
    const wrapper = mount(AttachmentField, {
      props: { modelValue: [existing.id], field: capField },
    })
    // Let the immediate watch chain settle before triggering the upload.
    await settle()
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      configurable: true,
      value: [
        fakeFile([2], 'b.pdf'),
        fakeFile([3], 'c.pdf'),
        fakeFile([4], 'd.pdf'),
        fakeFile([5], 'e.pdf'),
      ],
    })
    await input.trigger('change')
    await settle()
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect((emitted![0][0] as string[]).length).toBe(3) // existing + 2 new
    expect(wrapper.text()).toMatch(/Only 2 more/)
  })
})

describe('AttachmentField — remove', () => {
  it('removes the attachment from store and emits an updated array', async () => {
    const store = new AttachmentStore()
    const a = await store.add(fakeFile([1], 'a.pdf'))
    const b = await store.add(fakeFile([2], 'b.pdf'))
    const wrapper = mount(AttachmentField, {
      props: { modelValue: [a.id, b.id], field: baseField },
    })
    await settle()
    // Find the "Remove" button for the first row.
    const buttons = wrapper.findAll('button').filter(btn => btn.text() === 'Remove')
    expect(buttons.length).toBe(2)
    await buttons[0].trigger('click')
    await settle()
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual([b.id])
    // The blob is gone from the store too.
    expect(await store.get(a.id)).toBeNull()
  })
})
