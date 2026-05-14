<script setup lang="ts">
import UiDialog from '@/components/ui/UiDialog.vue'
import type { ImportCommitResult } from '@/services/import/ImportSource'

interface Props {
  open: boolean
  /** Success result OR null for failure mode. */
  result: ImportCommitResult | null
  /** Failure mode message (only used when `result` is null). */
  failureMessage?: string
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'close'): void
}>()

function close() {
  emit('update:open', false)
  emit('close')
}
</script>

<template>
  <UiDialog
    :open="open"
    :title="result ? 'Added to your vault' : 'Nothing was changed'"
    :description="''"
    close-label="Close"
    @update:open="(v) => { if (!v) close() }"
  >
    <div
      v-if="result"
      class="text-sm text-text-primary dark:text-gray-100 space-y-3"
    >
      <p>
        Added {{ result.added }} {{ result.added === 1 ? 'item' : 'items' }}
        across {{ result.sectionsAffected.length }}
        {{ result.sectionsAffected.length === 1 ? 'section' : 'sections' }}.
      </p>
      <p
        v-if="result.merged > 0 || result.skipped > 0"
        class="text-text-secondary dark:text-gray-400"
      >
        Merged {{ result.merged }}, skipped {{ result.skipped }}.
      </p>
      <p
        v-if="result.sectionsAffected.length > 0"
        class="text-text-secondary dark:text-gray-400"
      >
        Sections updated: {{ result.sectionsAffected.join(', ') }}
      </p>
    </div>
    <div
      v-else
      class="text-sm text-text-primary dark:text-gray-100 space-y-3"
    >
      <p>
        Something went wrong on our end. Nothing was changed. Try again, or save your data elsewhere first.
      </p>
      <p
        v-if="failureMessage"
        class="text-text-secondary dark:text-gray-400 text-xs"
      >
        {{ failureMessage }}
      </p>
    </div>
    <template #actions>
      <button
        type="button"
        class="px-4 py-2 bg-accent-700 text-surface-ivory rounded-md hover:bg-accent-800 focus-visible:outline-none focus-visible:shadow-focus"
        @click="close"
      >
        {{ result ? 'Close' : 'Try again' }}
      </button>
    </template>
  </UiDialog>
</template>
