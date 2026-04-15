import { computed } from 'vue'
import { useLegacyStore } from '@/store'

/**
 * Manage collapse/expand state for schema-driven sections.
 * State is persisted to the vault so it travels with exports/imports.
 *
 * Section keys are typically formatted as: `${schemaKey}.${dividerLabel}`
 */
export function useCollapsedSections() {
  const store = useLegacyStore()

  const collapsedMap = computed(() => store.data?.collapsedSections || {})

  function isCollapsed(key: string, defaultCollapsed = false): boolean {
    const value = collapsedMap.value[key]
    return value === undefined ? defaultCollapsed : value
  }

  async function setCollapsed(key: string, collapsed: boolean) {
    const next = { ...(store.data?.collapsedSections || {}) }
    // Always store the explicit value — deleting the key would revert to the
    // section's `defaultExpanded` setting, which breaks toggle for sections
    // that default to collapsed.
    next[key] = collapsed
    await store.updateData({ collapsedSections: next })
  }

  function toggle(key: string, defaultCollapsed = false) {
    setCollapsed(key, !isCollapsed(key, defaultCollapsed))
  }

  return {
    isCollapsed,
    setCollapsed,
    toggle,
  }
}
