<template>
  <div class="border border-gray-200 rounded-lg">
    <button
      @click="isExpanded = !isExpanded"
      class="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
      :class="{ 'rounded-b-lg': !isExpanded }"
    >
      <span class="font-medium text-gray-900">{{ label }}</span>
      <svg
        class="w-5 h-5 text-gray-500 transition-transform"
        :class="{ 'rotate-180': isExpanded }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    <div
      v-show="isExpanded"
      class="p-4 border-t border-gray-200"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  label: string
  defaultExpanded?: boolean
}>()

const isExpanded = ref(props.defaultExpanded ?? false)
</script>

