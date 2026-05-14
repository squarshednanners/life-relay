<script setup lang="ts">
// Grief-Mode Audit (per architecture.md § Per-Primitive Grief-Mode Audit Blocks):
//
//   Focus management under cognitive load:
//     - Tooltip shows on BOTH hover AND keyboard focus (reka-ui default) —
//       keyboard-only users never miss a tooltip available to mouse users.
//     - Tooltip does NOT trap focus. The trigger keeps focus while the
//       tooltip is open; tabbing away dismisses it. A confused user is
//       never stuck.
//     - Escape dismisses the tooltip without moving focus.
//
//   Surprise-reduction:
//     - Delay of 400ms by default (calm — not 0ms which feels jittery)
//       prevents tooltips from flashing on quick pointer transit.
//     - Tooltips are advisory, not modal. They never block the underlying
//       interaction or steal focus.
//     - ARIA: TooltipContent is aria-describedby-wired to the trigger so
//       screen readers announce the tip alongside the trigger label.
//
//   Destructive-action timing:
//     - Not applicable — tooltips are read-only advisory surfaces. They
//       never contain interactive elements per ARIA contract.
//
//   Reduced-motion behavior:
//     - Fade-in/out uses `motion-safe:` qualifier so
//       `prefers-reduced-motion: reduce` makes tooltips appear/disappear
//       instantly without transition.

import {
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
  TooltipArrow,
} from 'reka-ui'

interface Props {
  /** Companion Voice tooltip content (required — no hardcoded copy here) */
  content: string
  /** Which side of the trigger to anchor the tooltip */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Milliseconds before showing the tooltip on hover/focus */
  delayDuration?: number
}

withDefaults(defineProps<Props>(), {
  side: 'top',
  delayDuration: 400,
})
defineSlots<{
  trigger?: (props: Record<string, never>) => unknown
}>()
</script>

<template>
  <TooltipProvider :delay-duration="delayDuration">
    <TooltipRoot>
      <TooltipTrigger
        v-if="$slots.trigger"
        as-child
      >
        <slot name="trigger" />
      </TooltipTrigger>
      <TooltipPortal v-if="content">
        <TooltipContent
          :side="side"
          :side-offset="4"
          class="z-50 max-w-xs rounded-sm bg-text-primary px-2 py-1 text-body-sm text-surface-ivory shadow-hover motion-safe:transition-opacity motion-safe:duration-200"
        >
          {{ content }}
          <TooltipArrow class="fill-text-primary" />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
