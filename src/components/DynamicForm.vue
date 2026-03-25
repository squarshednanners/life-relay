<template>
  <div class="space-y-4">
    <!-- Array items -->
    <template v-if="schema.isArray">
      <div v-if="modelValue.length === 0" class="text-gray-500 mb-4">
        No items added yet.
      </div>
      <div v-else class="space-y-4 mb-6">
        <div
          v-for="(item, index) in modelValue"
          :key="index"
          class="border border-gray-200 rounded-lg p-4"
        >
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-semibold">
              {{ schema.arrayItemLabel?.(index, item) || `Item ${index + 1}` }}
            </h3>
            <button
              v-if="schema.isArray && props.allowRemove"
              @click="$emit('remove', index)"
              class="text-red-600 hover:text-red-800 text-sm"
            >
              Remove
            </button>
          </div>
          <DynamicFormFields
            :schema="schema"
            :model-value="item"
            :index="index"
            @update:model-value="(value) => updateItem(index, value)"
          />
        </div>
      </div>
      <button
        v-if="schema.isArray && props.allowAdd"
        @click="addItem"
        class="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
      >
        + Add {{ schema.title }}
      </button>
    </template>

    <!-- Single object -->
    <template v-else>
      <DynamicFormFields
        :schema="schema"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { FormSectionSchema } from '@/models/FormSchema'
import DynamicFormFields from './DynamicFormFields.vue'

const props = withDefaults(defineProps<{
  schema: FormSectionSchema
  modelValue: any | any[]
  allowAdd?: boolean // Whether to show the "Add" button (default: true)
  allowRemove?: boolean // Whether to show the "Remove" button (default: true)
}>(), {
  allowAdd: true,
  allowRemove: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: any | any[]]
  'remove': [index: number]
}>()

function addItem() {
  if (!props.schema.isArray) return
  
  // Use custom initialization if provided, otherwise use default
  const newItem = props.schema.initializeItem 
    ? props.schema.initializeItem()
    : initializeDefaultItem()
  
  const newArray = [...(props.modelValue as any[]), newItem]
  emit('update:modelValue', newArray)
}

function initializeDefaultItem() {
  const newItem: any = {}
  props.schema.fields.forEach(field => {
    // Skip section dividers - they don't have a name
    if (field.sectionDivider || !field.name) {
      return
    }
    if (field.type === 'checkbox') {
      newItem[field.name] = false
    } else if (field.type === 'select' && field.options) {
      newItem[field.name] = field.options[0]?.value || ''
    } else if (field.component === 'BeneficiarySelector') {
      // BeneficiarySelector expects an array
      newItem[field.name] = []
    } else {
      newItem[field.name] = ''
    }
  })
  return newItem
}

function updateItem(index: number, value: any) {
  if (!props.schema.isArray) return
  const newArray = [...(props.modelValue as any[])]
  newArray[index] = value
  emit('update:modelValue', newArray)
}
</script>

