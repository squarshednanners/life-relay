import { ref } from 'vue'

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
  duration: number
}

export interface ShowToastOptions {
  message: string
  variant?: ToastVariant
  duration?: number
}

const toasts = ref<ToastItem[]>([])

function makeId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function dismiss(id: string): void {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

function dismissAll(): void {
  toasts.value.splice(0, toasts.value.length)
}

function show(options: ShowToastOptions): string {
  const id = makeId()
  const variant = options.variant ?? 'info'
  const duration = options.duration ?? 5000
  toasts.value.push({ id, message: options.message, variant, duration })
  if (duration > 0) {
    setTimeout(() => dismiss(id), duration)
  }
  return id
}

/**
 * Compat shim. The legacy API was `showToast(message, type, duration)` where
 * `type` was 'success' | 'error'. Existing 40+ call sites compile unchanged.
 * Forward to the new {show} API, mapping the legacy two-variant `type` onto
 * the four-variant `variant`.
 */
function showToast(
  message: string,
  type: 'success' | 'error' = 'success',
  duration: number = 5000,
): string {
  return show({ message, variant: type, duration })
}

export function useToast() {
  return {
    toasts,
    show,
    showToast,
    dismiss,
    dismissAll,
    removeToast: dismiss, // legacy alias
  }
}

// Back-compat: legacy `Toast` interface name
export type Toast = ToastItem
