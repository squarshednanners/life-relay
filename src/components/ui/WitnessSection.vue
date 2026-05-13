<script setup lang="ts">
// Grief-Mode Audit (per docs/grief-mode-audit.md):
//
//   Focus management under cognitive load:
//     - N/A — passive layout wrapper. No interactive surface, no focus
//       management. Slot content is the consumer's responsibility.
//
//   Surprise-reduction:
//     - N/A — purely visual. No state, no announcements, no live regions.
//       The Witness Line is a static structural signal: "user-recorded
//       data lives here."
//
//   Destructive-action timing:
//     - N/A — non-interactive.
//
//   Reduced-motion behavior:
//     - No motion in the component. The border is static. No transitions,
//       no animations. Reduced-motion contract is met by virtue of zero
//       animation.
//
//   Forced-colors behavior:
//     - The border color consumes `--color-accent-700`, which `main.css`
//       overrides to the system `Highlight` color under
//       `@media (forced-colors: active)`. The structural signal survives
//       the user's palette override.
//
//   Semantic vs decorative:
//     - The line is SEMANTIC, not decorative. It marks "this section
//       holds the user's words." Do NOT add `aria-hidden` to the wrapper;
//       do NOT use the component on marketing copy or empty states. If a
//       section reasonably might NOT contain user data, render its
//       content without `<WitnessSection>`.

/**
 * Allowed wrapper tags. Constrained to layout-level block elements so a
 * consumer can't accidentally pass `'script'`, `'iframe'`, a void element,
 * or a custom element name. The default is `'div'` (no landmark / no
 * a11y obligation); pass `'section'`/`'article'`/`'aside'` for landmarks
 * and provide `aria-labelledby` so screen readers get a label.
 */
type WitnessSectionTag = 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'main' | 'nav'

interface Props {
  /**
   * Semantic HTML tag for the wrapper. Default `'div'` (no landmark).
   * Use `'section'` / `'article'` / `'aside'` when the surrounding
   * document structure calls for it — but remember those elements
   * require an accessible name (via `aria-labelledby` on the consumer
   * or by containing a heading); axe-core flags unnamed landmarks.
   */
  as?: WitnessSectionTag
}

withDefaults(defineProps<Props>(), {
  as: 'div',
})

defineSlots<{
  default?: (props: Record<string, never>) => unknown
}>()
</script>

<template>
  <component
    :is="as"
    class="border-l-[length:var(--witness-line-width)] border-l-[color:var(--color-accent-700)] pl-[var(--witness-line-padding-left)]"
  >
    <slot />
  </component>
</template>
