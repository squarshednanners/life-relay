<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-md flex-col gap-2">
      <!--
        Two persistent aria-live regions. They mount with the page and never
        re-create — late-creating an aria-live region only when a toast
        appears is unreliable across screen-reader / browser combinations.
        The TransitionGroup root IS the live region (not a wrapper around it)
        so toast elements are direct children — VoiceOver and other ATs
        observe mutations on the live-region element itself; nesting toasts
        inside an inner wrapper can drop announcements.
        We carry `role="status"` / `role="alert"` only — `aria-live` is
        implied by the role and the explicit attribute is redundant (and
        some screen readers double-announce when both are set).
      -->
      <TransitionGroup
        name="toast"
        tag="div"
        role="status"
        aria-atomic="false"
        class="flex flex-col gap-2"
      >
        <div
          v-for="toast in politeToasts"
          :key="toast.id"
          class="pointer-events-auto flex items-start gap-3 rounded-md border-l-4 p-4 shadow-hover"
          :class="variantClass(toast.variant)"
        >
          <span class="flex-1 text-body-md text-text-primary">{{ toast.message }}</span>
          <button
            type="button"
            class="text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:shadow-focus"
            :aria-label="dismissAriaLabel(toast)"
            @click="dismiss(toast.id)"
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
      </TransitionGroup>
      <TransitionGroup
        name="toast"
        tag="div"
        role="alert"
        aria-atomic="false"
        class="flex flex-col gap-2"
      >
        <div
          v-for="toast in assertiveToasts"
          :key="toast.id"
          class="pointer-events-auto flex items-start gap-3 rounded-md border-l-4 p-4 shadow-hover"
          :class="variantClass(toast.variant)"
        >
          <span class="flex-1 text-body-md text-text-primary">{{ toast.message }}</span>
          <button
            type="button"
            class="text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:shadow-focus"
            :aria-label="dismissAriaLabel(toast)"
            @click="dismiss(toast.id)"
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
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
// Grief-Mode Audit (per docs/grief-mode-audit.md):
//
//   Focus management — Toasts never steal focus. The dismiss button is
//   keyboard-reachable via Tab but is not auto-focused. Dismissing removes
//   the button; the browser returns focus to the prior element.
//
//   Surprise-reduction — Two aria-live regions persist from mount.
//   info/success append to polite; warning/error to assertive. Auto-dismiss
//   has a consumer-tunable duration (5s default; 0 disables).
//
//   Destructive-action timing — Dismissing a toast is non-destructive; the
//   originating action can always be re-triggered.
//
//   Reduced-motion — Transition uses Vue's TransitionGroup with CSS
//   transitions guarded by `prefers-reduced-motion: reduce` in the style
//   block. Reduced-motion users see instant appear/disappear.
import { computed } from 'vue'
import { useToast, type ToastItem, type ToastVariant } from '@/composables/useToast'

interface Props {
  /** Accessible label prefix for the dismiss button on every toast. */
  dismissLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  dismissLabel: 'Dismiss notification',
})

const { toasts, dismiss } = useToast()

// Exhaustive variant routing. A new ToastVariant added to the union will
// fail the `_exhaustive: never` check at compile time; until that's
// addressed, an unknown variant falls through to polite (safer default).
function variantRegion(variant: ToastVariant): 'polite' | 'assertive' {
  switch (variant) {
    case 'info':
    case 'success':
      return 'polite'
    case 'warning':
    case 'error':
      return 'assertive'
    default: {
      const _exhaustive: never = variant
      void _exhaustive
      return 'polite'
    }
  }
}

const politeToasts = computed(() =>
  toasts.value.filter(t => variantRegion(t.variant) === 'polite'),
)
const assertiveToasts = computed(() =>
  toasts.value.filter(t => variantRegion(t.variant) === 'assertive'),
)

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  info: 'border-l-border bg-surface-bone',
  success: 'border-l-status-success bg-status-success-bg',
  warning: 'border-l-status-warning bg-status-warning-bg',
  error: 'border-l-status-error bg-status-error-bg',
}

function variantClass(variant: ToastVariant): string {
  return VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.info
}

// Per-toast aria-label includes the message so SR users hearing a stack
// of dismiss buttons can tell which one they're about to dismiss. Story
// 1.6 code review caught the uniform-label issue.
function dismissAriaLabel(toast: ToastItem): string {
  return `${props.dismissLabel}: ${toast.message}`
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active,
  .toast-move {
    transition: none;
  }
  .toast-enter-from,
  .toast-leave-to {
    transform: none;
  }
}
</style>
