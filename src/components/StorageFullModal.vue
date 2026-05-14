<script setup lang="ts">
// Grief-Mode Audit (per docs/grief-mode-audit.md):
//
//   Focus management — UiDialog handles focus trap + restoration. The
//   "I understand" confirm button receives focus on open. Escape and
//   outside-click DO close the modal (any close path flips the local
//   `acknowledged` flag) but the `state === 'full'` singleton stays
//   tripped until usage drops below the threshold OR markFull is reset.
//   So even if the user Escapes the modal, the underlying state still
//   prevents further saves from succeeding — they'll see the modal again
//   on the next failed save attempt.
//
//   Surprise-reduction — fires only when state === 'full', which
//   requires either ≥ 99% measured usage OR a failed save with
//   QuotaExceededError. Both are user-triggered failure paths, not
//   background events.
//
//   Destructive-action timing — modal is informational (data isn't
//   destroyed; the failed save is rejected cleanly). User clicks "I
//   understand" to acknowledge; the failed save can be retried later.
//   No timing concerns.
//
//   Reduced-motion — UiDialog respects motion-safe.

import { ref, computed, watch } from 'vue'
import UiDialog from '@/components/ui/UiDialog.vue'
import { useStorageQuota } from '@/composables/useStorageQuota'

interface Props {
  /** Companion Voice title shown in the dialog header */
  title: string
  /** Companion Voice body copy explaining the situation + next steps */
  body: string
  /** Label for the single acknowledgement button */
  confirmLabel: string
  /** Accessible label for the dialog close affordance */
  closeLabel: string
}

defineProps<Props>()

const { state, refresh } = useStorageQuota()

// Per-modal-instance acknowledgement. When the user clicks "I understand",
// hide the modal even though state is still 'full' — they don't need to
// see it again until a NEW failed save triggers it. If state transitions
// out of 'full' (e.g., a refresh after deletion), reset the flag so a
// future re-entry to 'full' re-shows the modal.
const acknowledged = ref(false)
watch(state, next => {
  if (next !== 'full') acknowledged.value = false
})

const open = computed(() => state.value === 'full' && !acknowledged.value)

function acknowledge(): void {
  acknowledged.value = true
  // Trigger an estimate refresh so a one-way `markFull()` (from a save
  // error) can recover if the user freed space in the meantime. Without
  // this, state stays 'full' until the 60s auto-poll fires.
  void refresh()
}
</script>

<template>
  <UiDialog
    :open="open"
    :title="title"
    :description="body"
    :close-label="closeLabel"
    @update:open="
      v => {
        // Only honor the close to flip `acknowledged` — Escape and
        // outside-click are not viable dismissal paths here (the storage
        // is full; the user must acknowledge).
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
