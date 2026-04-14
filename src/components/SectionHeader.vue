<template>
  <div class="mb-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <span v-if="icon" class="text-3xl">{{ icon }}</span>
        {{ title }}
      </h2>
      <span
        v-if="completeness.total > 0"
        class="text-sm font-medium"
        :class="completenessColor"
      >
        {{ completeness.filled }}/{{ completeness.total }} fields
      </span>
    </div>
    <p v-if="description" class="text-gray-600 dark:text-gray-400 mt-1">{{ description }}</p>
    <div
      v-if="completeness.total > 0"
      class="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5"
    >
      <div
        class="h-1.5 rounded-full transition-all duration-500"
        :class="completenessBarColor"
        :style="{ width: completeness.percentage + '%' }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getIcon } from '@/utils/icons'
import type { FormSectionSchema } from '@/models/FormSchema'
import { computeCompleteness } from '@/composables/useSectionCompleteness'

const props = defineProps<{
  title: string
  description?: string
  icon?: string
  schema?: FormSectionSchema
  formData?: any
}>()

const icon = props.icon || getIcon(props.title)

const completeness = computed(() => {
  if (!props.schema || props.formData === undefined) {
    return { filled: 0, total: 0, percentage: 0 }
  }
  return computeCompleteness(props.schema, props.formData)
})

const completenessColor = computed(() => {
  const p = completeness.value.percentage
  if (p === 100) return 'text-green-600'
  if (p >= 50) return 'text-yellow-600'
  if (p > 0) return 'text-orange-500'
  return 'text-gray-400'
})

const completenessBarColor = computed(() => {
  const p = completeness.value.percentage
  if (p === 100) return 'bg-green-500'
  if (p >= 50) return 'bg-yellow-500'
  if (p > 0) return 'bg-orange-400'
  return 'bg-gray-300'
})
</script>
