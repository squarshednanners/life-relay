<script setup lang="ts">
import { ref } from 'vue'
import type { ImportSourceId } from '@/services/import/ImportSource'

defineEmits<{
  (e: 'select', source: ImportSourceId, input: File | string): void
}>()

const mode = ref<'choose' | 'paste'>('choose')
const pasteText = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

function chooseCsv() {
  fileInput.value?.click()
}

function choosePaste() {
  mode.value = 'paste'
}
</script>

<template>
  <div class="max-w-3xl">
    <div
      v-if="mode === 'choose'"
      class="grid gap-6 sm:grid-cols-2"
    >
      <button
        type="button"
        class="text-left rounded-lg border border-border dark:border-gray-700 bg-surface-ivory dark:bg-gray-800 hover:border-accent-700 dark:hover:border-accent-700 focus-visible:outline-none focus-visible:shadow-focus p-6 transition-colors"
        @click="chooseCsv"
      >
        <h3 class="text-lg font-medium text-text-primary dark:text-gray-100">
          Upload a CSV file
        </h3>
        <p class="mt-2 text-sm text-text-secondary dark:text-gray-400">
          A spreadsheet you saved from another app — Excel, Google Sheets, or any tool that exports CSV.
        </p>
      </button>

      <button
        type="button"
        class="text-left rounded-lg border border-border dark:border-gray-700 bg-surface-ivory dark:bg-gray-800 hover:border-accent-700 dark:hover:border-accent-700 focus-visible:outline-none focus-visible:shadow-focus p-6 transition-colors"
        @click="choosePaste"
      >
        <h3 class="text-lg font-medium text-text-primary dark:text-gray-100">
          Paste from clipboard
        </h3>
        <p class="mt-2 text-sm text-text-secondary dark:text-gray-400">
          Paste a list of contacts or accounts you have in a notes app. We'll do our best to make sense of the structure.
        </p>
      </button>
    </div>

    <div
      v-else
      class="rounded-lg border border-border dark:border-gray-700 bg-surface-ivory dark:bg-gray-800 p-6"
    >
      <h3 class="text-lg font-medium text-text-primary dark:text-gray-100">
        Paste your data
      </h3>
      <p class="mt-2 text-sm text-text-secondary dark:text-gray-400">
        Tab-separated, key-value blocks, or just lines of text. Blank lines separate records.
      </p>
      <textarea
        v-model="pasteText"
        rows="12"
        class="mt-4 w-full rounded-md border border-border dark:border-gray-700 bg-surface-white dark:bg-gray-900 text-text-primary dark:text-gray-100 p-3 text-sm font-mono focus-visible:outline-none focus-visible:shadow-focus"
        placeholder="name: Anna&#10;email: anna@example.com&#10;phone: 555-1212"
      />
      <div class="mt-4 flex gap-3">
        <button
          type="button"
          class="px-4 py-2 bg-accent-700 text-surface-ivory rounded-md hover:bg-accent-800 disabled:opacity-50 focus-visible:outline-none focus-visible:shadow-focus"
          :disabled="pasteText.trim().length === 0"
          @click="$emit('select', 'paste', pasteText)"
        >
          Continue
        </button>
        <button
          type="button"
          class="px-4 py-2 text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-gray-100 focus-visible:outline-none focus-visible:shadow-focus"
          @click="mode = 'choose'"
        >
          Back
        </button>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept=".csv,text/csv"
      class="hidden"
      @change="(e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) $emit('select', 'csv', file)
        ;(e.target as HTMLInputElement).value = ''
      }"
    >
  </div>
</template>
