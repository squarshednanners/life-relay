<script setup lang="ts">
// Grief-Mode Audit (per docs/grief-mode-audit.md):
//
//   Focus management — passive announcement. Does not steal focus or
//   trap it; the dismiss button is keyboard-reachable but not auto-
//   focused. After dismissal, focus returns to wherever it was.
//
//   Surprise-reduction — banner appears only when storage is genuinely
//   ≥ 80% used (per useStorageQuota.refresh). Dismissal is per-session
//   so the user isn't nagged on the same visit but does see it again
//   on the next session if the state still holds.
//
//   Destructive-action timing — N/A. The banner is informational; the
//   destructive action (deleting attachments to free space) is the
//   user's choice elsewhere in the app.
//
//   Reduced-motion — appearance uses motion-safe: classes; reduced-motion
//   users get instant appear/disappear with no transition.

import { computed } from 'vue'
import { useStorageQuota } from '@/composables/useStorageQuota'

interface Props {
  /** Companion Voice copy shown in the banner body */
  warningMessage: string
  /** Accessible label for the dismiss button */
  dismissLabel: string
}

defineProps<Props>()

const { state, dismissedThisSession, dismissBanner } = useStorageQuota()
const visible = computed(
  () => state.value === 'warning' && !dismissedThisSession.value,
)
</script>

<template>
  <!--
    The aria-live region must EXIST in the DOM before the banner becomes
    visible — late-mounted live regions don't reliably announce in screen
    readers. Use v-show (CSS visibility toggle) instead of v-if (DOM
    insert/remove) so the announcement fires when `warningMessage` first
    appears inside the live region.
  -->
  <div
    v-show="visible"
    role="status"
    aria-live="polite"
    class="flex items-start gap-3 rounded-md border-l-4 border-l-status-warning bg-status-warning-bg p-4 text-text-primary shadow-hover motion-safe:transition-opacity motion-safe:duration-200"
  >
    <span class="flex-1 text-body-md">{{ visible ? warningMessage : '' }}</span>
    <button
      type="button"
      class="text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:shadow-focus rounded-sm"
      :aria-label="dismissLabel"
      @click="dismissBanner"
    >
      <svg
        class="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>
</template>
