import { ref, computed, watchEffect } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme'

const stored = localStorage.getItem(STORAGE_KEY)
const theme = ref<ThemeMode>(
  stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
)
const systemPrefersDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)

// Listen for system preference changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  systemPrefersDark.value = e.matches
})

const isDark = computed(() => {
  if (theme.value === 'system') return systemPrefersDark.value
  return theme.value === 'dark'
})

// watchEffect re-runs whenever any reactive dependency inside changes
// This is more reliable than watch() for ensuring the DOM class stays in sync
watchEffect(() => {
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})

export function useTheme() {
  function setTheme(mode: ThemeMode) {
    theme.value = mode
    localStorage.setItem(STORAGE_KEY, mode)
  }

  return {
    theme,
    isDark,
    setTheme,
  }
}
