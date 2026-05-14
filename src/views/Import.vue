<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import SectionHeader from '@/components/SectionHeader.vue'
import ImportSourcePicker from '@/components/import/ImportSourcePicker.vue'
import ImportMappingPreview from '@/components/import/ImportMappingPreview.vue'
import ImportSummaryModal from '@/components/import/ImportSummaryModal.vue'
import { CsvImportSource } from '@/services/import/CsvImportSource'
import { PasteImportSource } from '@/services/import/PasteImportSource'
import { autoMapRecords } from '@/services/import/autoMap'
import { validateRecords } from '@/services/import/validate'
import { detectDuplicates } from '@/services/import/dedup'
import { commitImport, type CommitChoice } from '@/services/import/commit'
import type {
  ImportSourceId,
  ImportedRecord,
  ImportCommitResult,
} from '@/services/import/ImportSource'
import { schemaRegistry } from '@/schemas'
import { CURRENT_SCHEMA_VERSION } from '@/migrations'
import { useLegacyStore } from '@/store'
import type { DeathboxData } from '@/models/DeathboxData'

type Step = 'pick' | 'preview' | 'committing' | 'done' | 'failed' | 'error'

function emptyVault(): DeathboxData {
  return { schemaVersion: CURRENT_SCHEMA_VERSION } as DeathboxData
}

const router = useRouter()
const store = useLegacyStore()
const step = ref<Step>('pick')
const records = ref<ImportedRecord[]>([])
const dedupMap = ref<Map<number, unknown[]>>(new Map())
const result = ref<ImportCommitResult | null>(null)
const errorMessage = ref<string>('')

const csvAdapter = new CsvImportSource()
const pasteAdapter = new PasteImportSource()

async function handleSelect(source: ImportSourceId, input: File | string) {
  try {
    const adapter = source === 'csv' ? csvAdapter : pasteAdapter
    const parsed = await adapter.parse(input)
    const mapped = autoMapRecords(parsed, schemaRegistry)
    const validated = validateRecords(mapped, schemaRegistry)
    records.value = validated
    // Deep-clone store.data before passing into the pipeline so Vue
    // reactive proxies don't leak into dedup state — the dedup map
    // stores existing-record refs that could otherwise mutate under the
    // user as they edit elsewhere.
    const existingSnapshot = store.data
      ? (JSON.parse(JSON.stringify(store.data)) as DeathboxData)
      : emptyVault()
    dedupMap.value = detectDuplicates(validated, existingSnapshot)
    step.value = 'preview'
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : String(err)
    step.value = 'error'
  }
}

async function handleConfirm(finalRecords: ImportedRecord[], choices: CommitChoice[]) {
  step.value = 'committing'
  try {
    const commitResult = await commitImport(finalRecords, choices)
    result.value = commitResult
    // Reload store so the rest of the app sees the new data.
    await store.loadData()
    step.value = 'done'
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : String(err)
    result.value = null
    // Distinct failed step (was: 'done' with result === null). Makes
    // the state machine readable and lets the failure modal offer a
    // "Try again" path that stays on /import.
    step.value = 'failed'
  }
}

function handleCancel() {
  router.push({ name: 'dashboard' })
}

function handleSummaryClose() {
  router.push({ name: 'dashboard' })
}

function handleRetryFromFailed() {
  // Stay on /import and let the user adjust + re-confirm without
  // bouncing back to Dashboard. The preview records are still in
  // memory; result is reset.
  result.value = null
  errorMessage.value = ''
  step.value = 'preview'
}
</script>

<template>
  <div class="max-w-5xl">
    <SectionHeader
      title="Bring in what you already have"
      description="Import a CSV spreadsheet or paste structured text. We'll match fields to the right sections — you can adjust before anything is saved."
    />

    <div v-if="step === 'pick'">
      <ImportSourcePicker @select="handleSelect" />
    </div>

    <div v-else-if="step === 'preview'">
      <ImportMappingPreview
        :records="records"
        :dedup-map="dedupMap"
        @confirm="handleConfirm"
        @cancel="handleCancel"
      />
    </div>

    <div
      v-else-if="step === 'committing'"
      class="text-sm text-text-secondary dark:text-gray-400"
    >
      Adding to your vault…
    </div>

    <div
      v-else-if="step === 'error'"
      class="rounded-lg border border-border dark:border-gray-700 bg-surface-ivory dark:bg-gray-800 p-6"
    >
      <h3 class="text-lg font-medium text-text-primary dark:text-gray-100">
        We couldn't read that file
      </h3>
      <p class="mt-2 text-sm text-text-secondary dark:text-gray-400">
        {{ errorMessage }}
      </p>
      <button
        type="button"
        class="mt-4 px-4 py-2 bg-accent-700 text-surface-ivory rounded-md hover:bg-accent-800 focus-visible:outline-none focus-visible:shadow-focus"
        @click="step = 'pick'"
      >
        Try again
      </button>
    </div>

    <ImportSummaryModal
      :open="step === 'done' || step === 'failed'"
      :result="result"
      :failure-message="step === 'failed' ? errorMessage : undefined"
      @close="step === 'failed' ? handleRetryFromFailed() : handleSummaryClose()"
    />
  </div>
</template>
