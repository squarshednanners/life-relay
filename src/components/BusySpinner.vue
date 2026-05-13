<template>
  <svg
    class="h-4 w-4 motion-safe:animate-spin"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="3"
      opacity="0.25"
    />
    <path
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
</template>

<script setup lang="ts">
// Loading spinner — inline SVG, 16×16, inherits color from `currentColor`.
// Use inside a button next to the "Loading..." label. Respects
// `prefers-reduced-motion: reduce` (animation is gated by `motion-safe:`).
// Marked `aria-hidden="true"` so screen readers don't double-announce —
// the parent button should carry `aria-busy="true"` when busy.
</script>
