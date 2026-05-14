<script setup lang="ts">
// Grief-Mode Audit (per architecture.md § Per-Primitive Grief-Mode Audit Blocks):
//
//   Focus management under cognitive load:
//     - reka-ui DialogContent traps focus on mount and restores to the
//       trigger on close. Escape always closes. Outside-click closes. No
//       surprise focus jumps — a confused user can always Escape out.
//     - The first focusable inside DialogContent receives focus. If the
//       wrapper renders a close button, focus lands there — predictable
//       and never on a destructive primary action.
//
//   Surprise-reduction:
//     - State changes only happen in response to direct user action
//       (trigger click, Escape, close button, outside click) or to a
//       parent-driven `v-model:open` toggle. No timeout-driven dismissal.
//     - ARIA: DialogTitle / DialogDescription wire `aria-labelledby` /
//       `aria-describedby` automatically — screen readers announce the
//       dialog with the provided title + description on open.
//
//   Destructive-action timing:
//     - This wrapper is layout, not logic. Destructive-action confirmation
//       (delete, etc.) is the consumer's responsibility — pass a clearly
//       labeled action button into the `actions` slot, and consider a
//       confirmation step rather than relying on the dialog to gate
//       hesitation.
//
//   Reduced-motion behavior:
//     - Overlay + content use the `motion-safe:` Tailwind qualifier so
//       `prefers-reduced-motion: reduce` collapses the open/close
//       transitions to instant. No decorative motion ever.

import {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'reka-ui'

interface Props {
  /** v-model — controls open state */
  open: boolean
  /** Companion Voice title string; renders inside DialogTitle */
  title?: string
  /** Companion Voice description string; renders inside DialogDescription */
  description?: string
  /**
   * Accessible label for the close button (Companion Voice copy).
   * Required: the close button always renders, and its aria-label must
   * carry the consumer's intended dismiss copy. Forces deliberate
   * authorship of the dismiss string — no hidden default like `"Close"`.
   */
  closeLabel: string
}

defineProps<Props>()
defineEmits<{ 'update:open': [value: boolean] }>()
defineSlots<{
  trigger?: (props: Record<string, never>) => unknown
  title?: (props: Record<string, never>) => unknown
  description?: (props: Record<string, never>) => unknown
  default?: (props: Record<string, never>) => unknown
  actions?: (props: Record<string, never>) => unknown
}>()
</script>

<template>
  <DialogRoot
    :open="open"
    @update:open="(v) => $emit('update:open', v)"
  >
    <DialogTrigger
      v-if="$slots.trigger"
      as-child
    >
      <slot name="trigger" />
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-40 bg-text-primary/40 motion-safe:transition-opacity motion-safe:duration-200"
      />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-md bg-surface-bone dark:bg-gray-800 p-6 shadow-modal focus-visible:outline-none focus-visible:shadow-focus motion-safe:transition-transform motion-safe:duration-200"
      >
        <DialogTitle
          v-if="title || $slots.title"
          class="text-heading-md font-medium text-text-primary dark:text-gray-100"
        >
          <template v-if="title">
            {{ title }}
          </template>
          <slot
            v-else
            name="title"
          />
        </DialogTitle>
        <DialogDescription
          v-if="description || $slots.description"
          class="mt-2 text-body-md text-text-secondary dark:text-gray-400"
        >
          <template v-if="description">
            {{ description }}
          </template>
          <slot
            v-else
            name="description"
          />
        </DialogDescription>
        <div class="mt-4">
          <slot />
        </div>
        <div
          v-if="$slots.actions"
          class="mt-6 flex justify-end gap-2"
        >
          <slot name="actions" />
        </div>
        <DialogClose
          :aria-label="closeLabel"
          class="absolute right-4 top-4 rounded-sm text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-gray-100 focus-visible:outline-none focus-visible:shadow-focus"
        >
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          >
            <path d="M4 4 L12 12 M12 4 L4 12" />
          </svg>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
