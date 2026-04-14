<template>
  <div class="space-y-4">
    <!-- Array items -->
    <template v-if="schema.isArray">
      <div v-if="modelValue.length === 0" class="text-gray-500 dark:text-gray-400 mb-4">
        No items added yet.
      </div>
      <div v-else class="space-y-4 mb-6">
        <div
          v-for="(item, index) in modelValue"
          :key="index"
          class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
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
        class="mb-4 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
      >
        + Add {{ singularTitle }}
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
import { computed } from 'vue'
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

const SINGULAR_OVERRIDES: Record<string, string> = {
  'People & Personal Information': 'Person',
  'Beneficiaries': 'Beneficiary',
  'Debts & Loans': 'Debt / Loan',
  'Utilities & Subscriptions': 'Utility / Subscription',
  'Loyalty & Rewards Programs': 'Loyalty / Rewards Program',
  'Final Wishes & Services': 'Final Wishes Record',
  'Medical Information': 'Medical Record',
  'Business Ownership': 'Business',
  'Employment Benefits': 'Employment Record',
  'Other Insurance': 'Insurance Policy',
  'Property & Real Estate': 'Property',
}

const singularTitle = computed(() => {
  const title = props.schema.title
  if (SINGULAR_OVERRIDES[title]) return SINGULAR_OVERRIDES[title]
  // "ies" → "y" (e.g. "Entries" → "Entry")
  if (title.endsWith('ies')) return title.slice(0, -3) + 'y'
  // "sses" → "ss" (e.g. "Addresses" → "Address")
  if (title.endsWith('sses')) return title.slice(0, -2)
  // "s" → "" (e.g. "Phones" → "Phone", "Cards" → "Card")
  if (title.endsWith('s') && !title.endsWith('ss')) return title.slice(0, -1)
  return title
})

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

