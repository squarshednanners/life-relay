<script setup lang="ts">
// Grief-Mode Audit (per docs/grief-mode-audit.md):
//
//   Focus management — when this surface mounts, focus is moved to the
//   CTA via an onMounted call. The rest of the app behind it gets the
//   `inert` attribute applied (see template) so Tab cannot leak to the
//   broken vault underneath.
//
//   Surprise-reduction — fires only when migration fails AND the
//   rollback row is missing/broken. This is a genuine emergency state;
//   the user needs to act before anything else works.
//
//   Destructive-action timing — N/A. The user is being prompted to
//   restore from a backup; no destructive action is offered here.
//
//   Reduced-motion — no transitions on this surface; instant mount.

import { computed, nextTick, ref, watch } from 'vue'
import { useMigrationStatus } from '@/composables/useMigrationStatus'

interface Props {
  /** Companion Voice title — the situation in one line */
  title: string
  /** Companion Voice body — explains what happened + the next step */
  body: string
  /** CTA copy directing the user to the import flow */
  ctaLabel: string
  /** Route path for the import flow (e.g., '/dashboard') */
  ctaHref: string
}

defineProps<Props>()

const { state } = useMigrationStatus()
const visible = computed(() => state.value === 'requires-manual-import')
const ctaEl = ref<HTMLElement | null>(null)

// Move focus to the CTA on mount + apply `inert` to siblings so keyboard
// users can't tab into the broken vault behind the overlay. Vue Router
// link handles in-app navigation without a full page reload (which would
// retrigger loadData → re-fail the migration → infinite loop).
watch(
  visible,
  async opened => {
    if (opened) {
      await nextTick()
      ctaEl.value?.focus?.()
      // Apply inert to all body children EXCEPT the overlay itself. The
      // overlay's z-[100] places it above everything; inert blocks
      // keyboard + pointer events on the inert subtrees.
      document.querySelectorAll('body > *').forEach(el => {
        if (el !== ctaEl.value?.closest('[data-needs-manual-import-overlay]')) {
          (el as HTMLElement).inert = true
        }
      })
    } else {
      // Clear inert on close.
      document.querySelectorAll('body > *').forEach(el => {
        (el as HTMLElement).inert = false
      })
    }
  },
  { immediate: true },
)
</script>

<template>
  <div
    v-if="visible"
    data-needs-manual-import-overlay
    class="fixed inset-0 z-[100] flex items-center justify-center bg-surface-ivory p-6"
    role="dialog"
    aria-modal="true"
    aria-labelledby="needs-manual-import-title"
  >
    <div class="w-full max-w-lg rounded-md bg-surface-bone p-8 shadow-modal">
      <h1
        id="needs-manual-import-title"
        class="text-heading-lg font-medium text-text-primary mb-4"
      >
        {{ title }}
      </h1>
      <p class="text-body-md text-text-primary mb-8">
        {{ body }}
      </p>
      <!--
        Use router-link so in-app navigation doesn't trigger a full page
        reload. A full reload would re-run `loadData` → re-fail the
        migration → re-mount this surface → infinite recovery loop.
      -->
      <router-link
        ref="ctaEl"
        :to="ctaHref"
        class="inline-flex items-center justify-center px-4 py-3 bg-accent-700 text-surface-ivory rounded-md hover:bg-accent-800 focus-visible:outline-none focus-visible:shadow-focus"
      >
        {{ ctaLabel }}
      </router-link>
    </div>
  </div>
</template>
