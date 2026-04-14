<template>
  <div class="max-w-4xl">
    <SectionHeader
      title="Dashboard"
      description="Overview of your legacy information and quick actions"
    />

    <!-- Review Reminder -->
    <div
      v-if="reviewDue"
      class="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-4 mb-6 flex items-center justify-between"
    >
      <div>
        <p class="text-sm font-medium text-amber-800 dark:text-amber-200">
          Time for a review — it's been {{ daysSinceReview }} days since your last review.
        </p>
        <p class="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
          Regular reviews help keep your vault accurate and up to date.
        </p>
      </div>
      <button
        @click="markReviewed"
        class="ml-4 px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex-shrink-0"
      >
        Mark Reviewed
      </button>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h3>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          @click="exportData"
          class="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Export Vault
        </button>
        <button
          @click="importData"
          class="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Import Vault
        </button>
        <button
          @click="generatePDF"
          :disabled="isGenerating"
          class="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {{ isGenerating ? 'Generating...' : 'Download Full PDF' }}
        </button>
        <button
          @click="generateEmergencyPDF"
          :disabled="isGeneratingEmergency"
          class="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {{ isGeneratingEmergency ? 'Generating...' : 'Emergency One-Page Sheet' }}
        </button>
        <button
          @click="saveData"
          :disabled="isLoading"
          class="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {{ isLoading ? 'Saving...' : 'Save to Browser' }}
        </button>
        <button
          @click="deleteAllData"
          class="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 transition-colors"
        >
          Delete All Data
        </button>
      </div>
    </div>

    <!-- Getting Started Guide -->
    <div v-if="showGettingStarted" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5 mb-6">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">How Life Relay Works</h3>
          <ol class="text-sm text-blue-800 dark:text-blue-300 space-y-1.5 list-decimal list-inside">
            <li>Fill in the sections that matter to you using the sidebar — skip what doesn't apply.</li>
            <li>Your data saves automatically to this browser's local storage.</li>
            <li><strong>Export your vault</strong> using the button above — save the encrypted .json file to a USB drive, cloud storage, or safe location. This is your portable backup.</li>
            <li>Generate PDFs (full vault, emergency sheet, or attorney prep) to print and store physically.</li>
            <li>Come back periodically to review and re-export as things change.</li>
          </ol>
          <p class="text-xs text-blue-600 dark:text-blue-400 mt-3">
            Your data never leaves your device unless you explicitly export it. If you clear your browser data or switch devices, you'll need your exported vault file to restore.
          </p>
        </div>
        <button
          @click="dismissGettingStarted"
          class="ml-4 text-blue-400 dark:text-blue-500 hover:text-blue-600 dark:hover:text-blue-300 flex-shrink-0"
          title="Dismiss"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <ProgressTracker />

    <input
      ref="fileInput"
      type="file"
      accept=".json"
      @change="handleFileImport"
      class="hidden"
    />

    <!-- PDF Export Selection Modal -->
    <PdfExportModal
      :is-open="showPdfExportModal"
      :data="store.data"
      @cancel="showPdfExportModal = false"
      @generate="handlePdfExportGenerate"
    />

    <!-- Emergency Sheet Selection Modal -->
    <EmergencySheetModal
      :is-open="showEmergencyModal"
      :data="store.data"
      @cancel="showEmergencyModal = false"
      @generate="handleEmergencyGenerate"
    />

    <!-- Quick Start Modal -->
    <QuickStartModal
      :is-open="showQuickStart"
      @cancel="dismissQuickStart"
      @import="handleQuickStartImport"
    />

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
import { ref, computed } from 'vue'
import { useLegacyStore } from '@/store'
import { useToast } from '@/composables/useToast'
import { generatePDFDocument } from '@/pdf/generator'
import { generateEmergencySheet } from '@/pdf/emergencySheet'
import type { EmergencySheetSelections } from '@/pdf/emergencySheet'
import SectionHeader from '@/components/SectionHeader.vue'
import EmergencySheetModal from '@/components/EmergencySheetModal.vue'
import PdfExportModal from '@/components/PdfExportModal.vue'
import PasswordPromptModal from '@/components/PasswordPromptModal.vue'
import ProgressTracker from '@/components/ProgressTracker.vue'
import QuickStartModal from '@/components/QuickStartModal.vue'
import { isEncrypted } from '@/utils/encryption'

const store = useLegacyStore()
const { showToast } = useToast()
const fileInput = ref<HTMLInputElement | null>(null)
const isGenerating = ref(false)
const isGeneratingEmergency = ref(false)

const isLoading = computed(() => store.isLoading)

// Getting Started guide
const gettingStartedDismissed = ref(localStorage.getItem('gettingStartedDismissed') === 'true')
const showGettingStarted = computed(() => !gettingStartedDismissed.value)
function dismissGettingStarted() {
  gettingStartedDismissed.value = true
  localStorage.setItem('gettingStartedDismissed', 'true')
}

// Quick Start
const quickStartDismissed = ref(false)
const showQuickStart = computed(() => !store.hasData && !quickStartDismissed.value)

function dismissQuickStart() {
  quickStartDismissed.value = true
}

function handleQuickStartImport() {
  quickStartDismissed.value = true
  importData()
}

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

// Data is already loaded in App.vue

const REVIEW_INTERVAL_DAYS = 90

const daysSinceReview = computed(() => {
  const lastReview = store.data?.lastReviewedAt
  if (!lastReview) return Infinity
  const diff = Date.now() - new Date(lastReview).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
})

const reviewDue = computed(() => {
  if (!store.data) return false
  return daysSinceReview.value >= REVIEW_INTERVAL_DAYS
})

async function markReviewed() {
  try {
    await store.updateData({ lastReviewedAt: new Date().toISOString() })
    showToast('Vault marked as reviewed!', 'success')
  } catch {
    showToast('Error updating review date', 'error')
  }
}

async function saveData() {
  try {
    await store.saveData()
    showToast('Data saved successfully!', 'success')
  } catch (error) {
    showToast('Error saving data', 'error')
  }
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

const showPdfExportModal = ref(false)

function generatePDF() {
  if (!store.data) {
    showToast('No data to generate PDF. Please add some information first.', 'error')
    return
  }
  showPdfExportModal.value = true
}

async function handlePdfExportGenerate(sectionKeys: Set<string>) {
  showPdfExportModal.value = false
  if (!store.data) return

  isGenerating.value = true
  try {
    const pdfBytes = await generatePDFDocument(store.data, sectionKeys)
    const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `liferelay-${new Date().toISOString().split('T')[0]}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    showToast('PDF generated successfully!', 'success')
  } catch (error) {
    console.error('Error generating PDF:', error)
    showToast('Error generating PDF', 'error')
  } finally {
    isGenerating.value = false
  }
}

const showEmergencyModal = ref(false)

function generateEmergencyPDF() {
  if (!store.data) {
    showToast('No data to generate PDF. Please add some information first.', 'error')
    return
  }
  showEmergencyModal.value = true
}

async function handleEmergencyGenerate(selections: EmergencySheetSelections) {
  showEmergencyModal.value = false
  if (!store.data) return

  isGeneratingEmergency.value = true
  try {
    const pdfBytes = await generateEmergencySheet(store.data, selections)
    const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `emergency-sheet-${new Date().toISOString().split('T')[0]}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Emergency sheet generated!', 'success')
  } catch (error) {
    console.error('Error generating emergency sheet:', error)
    showToast('Error generating emergency sheet', 'error')
  } finally {
    isGeneratingEmergency.value = false
  }
}
</script>

