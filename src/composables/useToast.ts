import { ref } from 'vue'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error'
}

const toasts = ref<Toast[]>([])

const removeToast = (id: string) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

export function useToast() {
  const showToast = (message: string, type: 'success' | 'error' = 'success', duration: number = 5000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    toasts.value.push({ id, message, type })
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }

  return {
    toasts,
    showToast,
    removeToast,
  }
}

