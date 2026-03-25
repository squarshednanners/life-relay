import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLegacyStore } from '../index'

describe('Legacy Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with null data', () => {
    const store = useLegacyStore()
    expect(store.data).toBeNull()
    expect(store.hasData).toBe(false)
  })

  // Add more tests as needed
})

