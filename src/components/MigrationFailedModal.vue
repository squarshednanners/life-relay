<script setup lang="ts">
// Grief-Mode Audit (per docs/grief-mode-audit.md):
//
//   Focus management — UiDialog handles focus trap + restore. The
//   acknowledge button receives focus on open; Escape AND outside-click
//   close, since the user's data is safe (the rollback already ran).
//
//   Surprise-reduction — fires only when the migration framework has
//   completed a rollback. No background timing; the modal appears
//   exactly when state flips to 'rolled-back' (during loadData).
//
//   Destructive-action timing — N/A. Data was restored from rollback;
//   no destructive action is offered by this modal.
//
//   Reduced-motion — UiDialog respects motion-safe.

import { computed } from 'vue'
import UiDialog from '@/components/ui/UiDialog.vue'
import { useMigrationStatus } from '@/composables/useMigrationStatus'

interface Props {
  /** Companion Voice title for the dialog */
  title: string
  /** Companion Voice body copy — explains what happened + reassures */
  body: string
  /** Label for the acknowledge button */
  confirmLabel: string
  /** Accessible label for the close affordance */
  closeLabel: string
}

defineProps<Props>()

const { state, acknowledge } = useMigrationStatus()

const open = computed(() => state.value === 'rolled-back')
</script>

<template>
  <UiDialog
    :open="open"
    :title="title"
    :description="body"
    :close-label="closeLabel"
    @update:open="
      v => {
        if (!v) acknowledge()
      }
    "
  >
    <template #actions>
      <button
        type="button"
        class="px-4 py-2 bg-accent-700 text-surface-ivory rounded-md hover:bg-accent-800 focus-visible:outline-none focus-visible:shadow-focus"
        @click="acknowledge"
      >
        {{ confirmLabel }}
      </button>
    </template>
  </UiDialog>
</template>
