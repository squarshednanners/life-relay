<script setup lang="ts">
// Grief-Mode Audit (per architecture.md § Per-Primitive Grief-Mode Audit Blocks):
//
//   Focus management under cognitive load:
//     - Popover is non-modal: opening it does NOT trap focus. Focus moves
//       into the popover content on open (reka-ui default) and returns to
//       the trigger on close. Outside-click and Escape both close.
//     - Tab key cycles through content normally — does not get "stuck"
//       inside the popover. Predictable behavior under cognitive load.
//
//   Surprise-reduction:
//     - Open/close is consumer-driven via `v-model:open` or the trigger
//       click. No timeout-driven open. No surprise display from background
//       processes.
//     - ARIA: `role=dialog` is auto-applied by reka-ui PopoverContent when
//       focus enters; otherwise the content is announced as a popover.
//
//   Destructive-action timing:
//     - The wrapper itself has no destructive actions. Any destructive
//       content (e.g., a confirm button) inside the popover slot is the
//       consumer's responsibility — popovers are NOT the right surface
//       for destructive confirmation; consider UiDialog instead.
//
//   Reduced-motion behavior:
//     - Open/close transitions use `motion-safe:` Tailwind qualifiers so
//       `prefers-reduced-motion: reduce` collapses them to instant. No
//       slide-in or fade animation under reduced motion.

import {
  PopoverRoot,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
  PopoverArrow,
} from 'reka-ui'

interface Props {
  /** v-model — controls open state */
  open: boolean
  /** Which side of the trigger to anchor the popover */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Alignment along the chosen side */
  align?: 'start' | 'center' | 'end'
  /** Pixel offset from the trigger */
  sideOffset?: number
}

withDefaults(defineProps<Props>(), {
  side: 'bottom',
  align: 'center',
  sideOffset: 4,
})
defineEmits<{ 'update:open': [value: boolean] }>()
defineSlots<{
  trigger?: (props: Record<string, never>) => unknown
  default?: (props: Record<string, never>) => unknown
}>()
</script>

<template>
  <PopoverRoot
    :open="open"
    @update:open="(v) => $emit('update:open', v)"
  >
    <PopoverTrigger
      v-if="$slots.trigger"
      as-child
    >
      <slot name="trigger" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        :side="side"
        :align="align"
        :side-offset="sideOffset"
        class="z-50 rounded-md bg-surface-bone p-4 shadow-hover text-body-md text-text-primary focus-visible:outline-none focus-visible:shadow-focus motion-safe:transition-opacity motion-safe:duration-200"
      >
        <slot />
        <PopoverArrow class="fill-surface-bone" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
