import { ref, readonly } from 'vue'

const isOpen = ref(false)

function open(): void {
  isOpen.value = true
}

function close(): void {
  isOpen.value = false
}

function toggle(): void {
  isOpen.value = !isOpen.value
}

/**
 * Singleton state for the global command palette. `UiCommand.vue` reads
 * `isOpen` reactively; consumers call `open()` / `close()` / `toggle()` to
 * drive it. There is intentionally only one palette per app — multiple
 * concurrent palettes are a UX defect.
 */
export function useCommandPalette() {
  return {
    isOpen: readonly(isOpen),
    open,
    close,
    toggle,
  }
}
