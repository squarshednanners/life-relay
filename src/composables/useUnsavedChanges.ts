import { ref, watch, onBeforeUnmount, type Ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

/**
 * Tracks unsaved changes and warns before navigation.
 *
 * Usage:
 *   const { markClean, isDirty } = useUnsavedChanges(formData)
 *   // Call markClean() after saving
 *
 * Handles both in-app route changes (vue-router guard) and
 * browser-level navigation (beforeunload).
 */
export function useUnsavedChanges(formData: Ref<any>, message = 'You have unsaved changes. Are you sure you want to leave?') {
  const isDirty = ref(false)
  let isInitialized = false

  // Watch for changes after initial load
  const stopWatch = watch(
    formData,
    () => {
      if (isInitialized) {
        isDirty.value = true
      }
    },
    { deep: true },
  )

  // Mark as initialized after a tick (so initial load doesn't trigger dirty)
  function initialize() {
    // Use setTimeout to skip the initial reactive flush
    setTimeout(() => {
      isInitialized = true
    }, 100)
  }

  function markClean() {
    isDirty.value = false
  }

  // Vue Router guard
  onBeforeRouteLeave((_to, _from, next) => {
    if (isDirty.value) {
      const answer = window.confirm(message)
      if (!answer) {
        next(false)
        return
      }
    }
    next()
  })

  // Browser beforeunload guard
  function beforeUnloadHandler(e: BeforeUnloadEvent) {
    if (isDirty.value) {
      e.preventDefault()
      e.returnValue = message
      return message
    }
  }

  window.addEventListener('beforeunload', beforeUnloadHandler)

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', beforeUnloadHandler)
    stopWatch()
  })

  return {
    isDirty,
    markClean,
    initialize,
  }
}
