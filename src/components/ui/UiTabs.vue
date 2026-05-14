<script setup lang="ts">
// Grief-Mode Audit (per architecture.md § Per-Primitive Grief-Mode Audit Blocks):
//
//   Focus management under cognitive load:
//     - Arrow keys (left/right or up/down depending on orientation) move
//       between TabsTrigger elements. Home / End jump to first/last.
//       reka-ui handles this automatically. Focus-visible ring tells the
//       user where they are at every keypress.
//     - Activating a tab (Space / Enter) reveals its content panel; focus
//       stays on the trigger (does not jump into the panel). The user
//       chooses when to Tab into the panel content.
//
//   Surprise-reduction:
//     - No surprise tab changes from background events — `modelValue` is
//       v-modelled from the consumer; only consumer or user interaction
//       changes it.
//     - Each panel renders only when its tab is active (TabsContent
//       handles this), keeping the DOM small and announcements
//       predictable.
//
//   Destructive-action timing:
//     - Not applicable directly. If a tab switch loses unsaved consumer
//       state, the consumer is responsible for guarding the switch
//       (e.g., with UiDialog confirmation).
//
//   Reduced-motion behavior:
//     - No motion in the tabs themselves. Active-tab indicator changes
//       instantly. Content panels swap without transition. Reduced-motion
//       contract is met by virtue of zero animations.

import { computed, watch } from 'vue'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'

interface TabDescriptor {
  /** Stable identifier for this tab; matches `modelValue` */
  value: string
  /** Companion Voice label shown on the trigger */
  label: string
  /** Optional accessible-name override for the trigger */
  ariaLabel?: string
}

interface Props {
  /** v-model — currently active tab value */
  modelValue: string
  /** Ordered list of tabs to render */
  tabs: TabDescriptor[]
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

// Fall back to the first tab when `modelValue` doesn't match any descriptor
// — guards against consumers passing an unknown id or '' (which reka-ui
// treats as "no active tab", silently rendering empty panels). Emit a
// corrective `update:modelValue` so the parent's state syncs.
const effectiveValue = computed(() => {
  const match = props.tabs.find((t) => t.value === props.modelValue)
  return match?.value ?? props.tabs[0]?.value ?? ''
})

watch(effectiveValue, (next) => {
  if (next !== props.modelValue) {
    emit('update:modelValue', next)
  }
}, { immediate: true })
defineSlots<{
  /** Render the active tab's content. Receives `{ value }` so consumers
   *  can switch on the active tab id. */
  default?: (props: { value: string }) => unknown
}>()
</script>

<template>
  <TabsRoot
    :model-value="effectiveValue"
    @update:model-value="(v) => $emit('update:modelValue', String(v))"
  >
    <TabsList
      class="flex border-b border-border"
    >
      <TabsTrigger
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        :aria-label="tab.ariaLabel || undefined"
        class="-mb-px border-b-2 border-transparent px-4 py-2 text-body-sm text-text-secondary focus-visible:outline-none focus-visible:shadow-focus data-[state=active]:border-accent-700 data-[state=active]:text-text-primary data-[state=active]:font-medium"
      >
        {{ tab.label }}
      </TabsTrigger>
    </TabsList>
    <TabsContent
      v-for="tab in tabs"
      :key="tab.value"
      :value="tab.value"
      class="pt-4 focus-visible:outline-none focus-visible:shadow-focus"
    >
      <slot :value="tab.value" />
    </TabsContent>
  </TabsRoot>
</template>
