<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      class="w-full px-3 py-2 border border-gray-300 rounded-md"
    >
      <option value="">Select a person</option>
      <option
        v-for="person in availablePeople"
        :key="person.id"
        :value="person.id"
      >
        {{ person.name || 'Unnamed' }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLegacyStore } from '@/store'

const props = defineProps<{
  modelValue: string
  label?: string
  required?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const store = useLegacyStore()

const availablePeople = computed(() => {
  return store.data?.people || []
})
</script>

