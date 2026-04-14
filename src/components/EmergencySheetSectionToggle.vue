<template>
  <div>
    <div class="flex items-center justify-between mb-1">
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ label }}</span>
      <button
        type="button"
        @click="$emit('toggleAll')"
        class="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
      >
        {{ count === total ? 'Deselect all' : 'Select all' }}
      </button>
    </div>
    <div class="ml-2 space-y-0.5">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  count: number
  total: number
}>()

defineEmits<{
  toggleAll: []
}>()
</script>
