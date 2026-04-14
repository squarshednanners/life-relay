<template>
  <div class="max-w-3xl">
    <SectionHeader
      title="Settings"
      description="Application settings and data management"
    />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
      <!-- Appearance -->
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Appearance</h3>
        <div class="flex gap-2">
          <button
            v-for="option in themeOptions"
            :key="option.value"
            @click="setTheme(option.value)"
            class="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
            :class="theme === option.value
              ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300'
              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <!-- Data Management -->
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Data Management</h3>
        <div class="space-y-3">
          <button
            @click="exportData"
            class="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-left"
          >
            Export Vault
          </button>
          <button
            @click="importData"
            class="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-left"
          >
            Import Vault
          </button>
          <button
            @click="deleteAllData"
            class="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-left"
          >
            Delete All Data
          </button>
        </div>
        <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
          <strong>Note:</strong> You can optionally encrypt exported files with a password to protect your sensitive data.
        </p>
      </div>

      <!-- About -->
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">About</h3>
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <LifeRelayLogo size="lg" />
            <div>
              <p class="font-semibold text-gray-900 dark:text-gray-100">Life Relay</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Version 2.0.0</p>
            </div>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Privacy-first, offline-capable estate planning application. All data is stored locally in your
            browser using IndexedDB. No servers, no cloud, no tracking. Your information never leaves your device.
          </p>
          <div>
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Key Features</h4>
            <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1.5">
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-0.5 flex-shrink-0">&check;</span>
                <span>26 organized sections across 8 categories covering finances, insurance, digital assets, legal documents, and more</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-0.5 flex-shrink-0">&check;</span>
                <span>Crypto asset management with wallet, exchange, multi-sig, and seed phrase documentation with chain-specific recovery instructions</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-0.5 flex-shrink-0">&check;</span>
                <span>Estate Planning Guide with will and trust preparation checklists and Attorney Preparation Summary PDF</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-0.5 flex-shrink-0">&check;</span>
                <span>Emergency one-page information sheet PDF with selectable sections</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-0.5 flex-shrink-0">&check;</span>
                <span>Full vault PDF export with selective section inclusion</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-0.5 flex-shrink-0">&check;</span>
                <span>AES-256 encrypted JSON import/export for secure backups</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-0.5 flex-shrink-0">&check;</span>
                <span>Progress tracking dashboard with 90-day review reminders</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-0.5 flex-shrink-0">&check;</span>
                <span>Installable Progressive Web App (PWA) — works fully offline</span>
              </li>
            </ul>
          </div>
          <div class="pt-2 border-t border-gray-100 dark:border-gray-700">
            <p class="text-xs text-gray-400 dark:text-gray-500">
              Built with Vue 3, TypeScript, Tailwind CSS, IndexedDB, and pdf-lib. All PDF generation happens client-side.
            </p>
          </div>
        </div>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept=".json"
        @change="handleFileImport"
        class="hidden"
      />
    </div>

    <!-- Password Prompt Modal -->
    <PasswordPromptModal
      :is-open="showPasswordModal"
      :title="passwordModalTitle"
      :description="passwordModalDescription"
      :confirm-label="passwordModalConfirmLabel"
      :confirm-placeholder="passwordModalConfirmPlaceholder"
      :submit-label="passwordModalSubmitLabel"
      :show-skip="passwordModalShowSkip"
      skip-label="Export without password"
      @confirm="handlePasswordConfirm"
      @cancel="handlePasswordCancel"
      @skip="handlePasswordSkip"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useLegacyStore } from '@/store'
import { useToast } from '@/composables/useToast'
import { useTheme } from '@/composables/useTheme'
import type { ThemeMode } from '@/composables/useTheme'
import SectionHeader from '@/components/SectionHeader.vue'
import LifeRelayLogo from '@/components/LifeRelayLogo.vue'
import PasswordPromptModal from '@/components/PasswordPromptModal.vue'
import { isEncrypted } from '@/utils/encryption'

const store = useLegacyStore()
const { showToast } = useToast()
const { theme, setTheme } = useTheme()
const fileInput = ref<HTMLInputElement | null>(null)

const themeOptions: { label: string; value: ThemeMode }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
]

// Password modal state
const showPasswordModal = ref(false)
const passwordModalTitle = ref('')
const passwordModalDescription = ref('')
const passwordModalConfirmLabel = ref('')
const passwordModalConfirmPlaceholder = ref('')
const passwordModalSubmitLabel = ref('Confirm')
const passwordModalShowSkip = ref(false)
const pendingAction = ref<'export' | 'import' | null>(null)
const pendingFileContent = ref<string | null>(null)

async function exportData() {
  // Show password prompt for export (optional)
  passwordModalTitle.value = 'Encrypt Export (Optional)'
  passwordModalDescription.value = 'Enter a password to encrypt your exported vault file, or skip to export without encryption. If you encrypt, make sure to remember the password as you will need it to import the file later.'
  passwordModalConfirmLabel.value = 'Confirm Password'
  passwordModalConfirmPlaceholder.value = 'Re-enter password'
  passwordModalSubmitLabel.value = 'Export with Password'
  passwordModalShowSkip.value = true
  pendingAction.value = 'export'
  showPasswordModal.value = true
}

function importData() {
  fileInput.value?.click()
}

async function handleFileImport(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    pendingFileContent.value = text

    // Check if file is encrypted
    if (isEncrypted(text)) {
      // Show password prompt for encrypted import
      passwordModalTitle.value = 'Decrypt Import'
      passwordModalDescription.value = 'This file is encrypted. Enter the password to decrypt and import your vault.'
      passwordModalConfirmLabel.value = ''
      passwordModalConfirmPlaceholder.value = ''
      passwordModalSubmitLabel.value = 'Import'
      passwordModalShowSkip.value = false
      pendingAction.value = 'import'
      showPasswordModal.value = true
    } else {
      // Not encrypted, import directly
      await store.importJSON(text)
      showToast('Data imported successfully!', 'success')
    }
  } catch (error) {
    showToast('Error reading file. Please check the file format.', 'error')
  }
  target.value = ''
}

async function handlePasswordConfirm(password: string) {
  showPasswordModal.value = false

  try {
    if (pendingAction.value === 'export') {
      // Export with encryption
      const encryptedJson = await store.exportJSON(password)
      const blob = new Blob([encryptedJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `liferelay-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast('Data exported successfully with encryption!', 'success')
    } else if (pendingAction.value === 'import' && pendingFileContent.value) {
      // Import with decryption
      await store.importJSON(pendingFileContent.value, password)
      showToast('Data imported successfully!', 'success')
      pendingFileContent.value = null
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Operation failed'
    showToast(errorMessage, 'error')
  } finally {
    pendingAction.value = null
  }
}

async function handlePasswordSkip() {
  showPasswordModal.value = false

  try {
    if (pendingAction.value === 'export') {
      // Export without encryption
      const json = await store.exportJSON()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `liferelay-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast('Data exported successfully!', 'success')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Operation failed'
    showToast(errorMessage, 'error')
  } finally {
    pendingAction.value = null
  }
}

function handlePasswordCancel() {
  showPasswordModal.value = false
  pendingAction.value = null
  pendingFileContent.value = null
}

async function deleteAllData() {
  if (confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
    try {
      await store.deleteData()
      showToast('All data deleted successfully!', 'success')
    } catch (error) {
      showToast('Error deleting data', 'error')
    }
  }
}
</script>
