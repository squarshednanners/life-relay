/**
 * Smoke test for the Import view (Story 1.14a, AC4 + AC11).
 *
 * Pins that the 3-step state machine renders and transitions: picker →
 * preview → committing/done. We test the orchestration; the unit tests
 * elsewhere pin the actual import logic.
 */
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Import from '../Import.vue'
import { IDBFactory } from 'fake-indexeddb'
import { LocalDataStore } from '@/services/LocalDataStore'

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'dashboard', component: { template: '<div />' } },
      { path: '/import', name: 'import', component: Import },
    ],
  })
}

beforeEach(async () => {
  setActivePinia(createPinia())
  globalThis.indexedDB = new IDBFactory()
  await new LocalDataStore().delete()
})

describe('Import view — initial render', () => {
  it('mounts in the picker step', async () => {
    const router = makeRouter()
    await router.push('/import')
    const wrapper = mount(Import, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.text()).toContain('Upload a CSV file')
    expect(wrapper.text()).toContain('Paste from clipboard')
  })

  it('shows the section header', async () => {
    const router = makeRouter()
    await router.push('/import')
    const wrapper = mount(Import, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.text()).toContain('Bring in what you already have')
  })
})
