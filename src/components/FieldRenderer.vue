<template>
  <!-- Section Divider -->
  <div
    v-if="field.sectionDivider && (!field.name || field.name.startsWith('_'))"
    :class="field.sectionDivider.showBorder !== false ? 'col-span-1 md:col-span-2 border-t border-gray-200 dark:border-gray-600 pt-4 mt-2' : 'col-span-1 md:col-span-2 pt-2'"
  >
    <h4 v-if="field.sectionDivider.label" class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
      {{ field.sectionDivider.label }}
    </h4>
  </div>

  <!-- Nested Array Field -->
  <div
    v-else-if="field.type === 'array' && field.arraySchema && field.name"
    :class="field.fullWidth ? 'col-span-1 md:col-span-2' : `col-span-1 md:col-span-${field.colSpan || 1}`"
  >
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {{ field.label }}
      <span v-if="field.required" class="text-red-500">*</span>
    </label>
    <DynamicForm
      :schema="field.arraySchema"
      :model-value="fieldValue(field.name!) || []"
      :allow-add="field.arrayAllowAdd !== false"
      :allow-remove="field.arrayAllowRemove !== false"
      @update:model-value="updateField(field.name!, $event)"
      @remove="removeArrayItem(field.name!, $event)"
    />
  </div>

  <!-- Custom components -->
  <div
    v-else-if="field.component && field.name"
    :class="field.fullWidth ? 'col-span-1 md:col-span-2' : `col-span-1 md:col-span-${field.colSpan || 1}`"
  >
    <component
      :is="getComponent(field.component)"
      :id="`${field.name}-${index ?? ''}`"
      :model-value="fieldValue(field.name)"
      @update:model-value="updateField(field.name, $event)"
      :label="field.label"
      :required="field.required"
      :parent-data="modelValue"
      :on-update="(fieldName: string, value: any) => updateField(fieldName, value)"
      v-bind="field.componentProps || {}"
    />
  </div>

  <!-- Password input -->
  <div
    v-else-if="field.type === 'password' && field.name"
    :class="field.fullWidth ? 'col-span-1 md:col-span-2' : `col-span-1 md:col-span-${field.colSpan || 1}`"
  >
    <label :for="`${field.name}-${index ?? ''}`" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {{ field.label }}
      <span v-if="field.required" class="text-red-500">*</span>
    </label>
    <div class="relative">
      <input
        :id="`${field.name}-${index ?? ''}`"
        :type="passwordVisible[field.name!] ? 'text' : 'password'"
        :value="fieldValue(field.name)"
        @input="updateField(field.name, ($event.target as HTMLInputElement).value)"
        @blur="onBlur(field)"
        :placeholder="field.placeholder"
        :required="field.required"
        :aria-required="field.required || undefined"
        :aria-invalid="!!(field.name && touched[field.name] && errors[field.name]) || undefined"
        :aria-describedby="describedBy(field)"
        :class="['w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100', inputBorderClass(field)]"
      />
      <button
        type="button"
        @click="passwordVisible[field.name!] = !passwordVisible[field.name!]"
        class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
        :aria-label="passwordVisible[field.name!] ? 'Hide' : 'Show'"
      >
        <svg v-if="passwordVisible[field.name!]" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>
    </div>
    <label
      v-if="field.manualEntry"
      class="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400"
    >
      <input
        type="checkbox"
        :checked="fieldValue(getManualEntryFieldName(field))"
        @change="updateField(getManualEntryFieldName(field), ($event.target as HTMLInputElement).checked)"
        class="mr-2"
      />
      <span>Leave space in PDF for manual entry</span>
    </label>
    <p v-if="field.helpText" :id="helpId(field.name!)" class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ field.helpText }}</p>
    <p v-if="field.name && touched[field.name] && errors[field.name]" :id="errorId(field.name)" class="mt-1 text-sm text-red-600" role="alert">{{ errors[field.name] }}</p>
  </div>

  <!-- Standard text input -->
  <div
    v-else-if="(field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'number') && field.name"
    :class="field.fullWidth ? 'col-span-1 md:col-span-2' : `col-span-1 md:col-span-${field.colSpan || 1}`"
  >
    <label :for="`${field.name}-${index ?? ''}`" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {{ field.label }}
      <span v-if="field.required" class="text-red-500">*</span>
    </label>
    <input
      :id="`${field.name}-${index ?? ''}`"
      :type="field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'"
      :value="fieldValue(field.name!)"
      @input="updateField(field.name!, ($event.target as HTMLInputElement).value)"
      @blur="onBlur(field)"
      :placeholder="field.placeholder"
      :required="field.required"
      :aria-required="field.required || undefined"
      :aria-invalid="!!(field.name && touched[field.name!] && errors[field.name!]) || undefined"
      :aria-describedby="describedBy(field)"
      :class="['w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100', inputBorderClass(field)]"
    />
    <label
      v-if="field.manualEntry"
      class="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400"
    >
      <input
        type="checkbox"
        :checked="fieldValue(getManualEntryFieldName(field))"
        @change="updateField(getManualEntryFieldName(field), ($event.target as HTMLInputElement).checked)"
        class="mr-2"
      />
      <span>Leave space in PDF for manual entry</span>
    </label>
    <p v-if="field.helpText" :id="helpId(field.name!)" class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ field.helpText }}</p>
    <p v-if="field.name && touched[field.name] && errors[field.name]" :id="errorId(field.name)" class="mt-1 text-sm text-red-600" role="alert">{{ errors[field.name] }}</p>
  </div>

  <!-- Textarea -->
  <div
    v-else-if="field.type === 'textarea' && field.name"
    :class="field.fullWidth ? 'col-span-1 md:col-span-2' : `col-span-1 md:col-span-${field.colSpan || 1}`"
  >
    <label :for="`${field.name}-${index ?? ''}`" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {{ field.label }}
      <span v-if="field.required" class="text-red-500">*</span>
    </label>
    <textarea
      :id="`${field.name}-${index ?? ''}`"
      :value="fieldValue(field.name)"
      @input="updateField(field.name, ($event.target as HTMLTextAreaElement).value)"
      @blur="onBlur(field)"
      :placeholder="field.placeholder"
      :required="field.required"
      :aria-required="field.required || undefined"
      :aria-invalid="!!(field.name && touched[field.name!] && errors[field.name!]) || undefined"
      :aria-describedby="describedBy(field)"
      :rows="field.rows || 3"
      :class="[
        'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100',
        inputBorderClass(field),
        field.manualEntry ? 'font-mono text-sm' : ''
      ]"
    />
    <label
      v-if="field.manualEntry"
      class="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400"
    >
      <input
        type="checkbox"
        :checked="fieldValue(getManualEntryFieldName(field))"
        @change="updateField(getManualEntryFieldName(field), ($event.target as HTMLInputElement).checked)"
        class="mr-2"
      />
      <span>Leave space in PDF for manual entry</span>
    </label>
    <p v-if="field.helpText" :id="helpId(field.name!)" class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ field.helpText }}</p>
    <p v-if="field.name && touched[field.name] && errors[field.name]" :id="errorId(field.name)" class="mt-1 text-sm text-red-600" role="alert">{{ errors[field.name] }}</p>
  </div>

  <!-- Select -->
  <div
    v-else-if="field.type === 'select' && field.name"
    :class="field.fullWidth ? 'col-span-1 md:col-span-2' : `col-span-1 md:col-span-${field.colSpan || 1}`"
  >
    <label :for="`${field.name}-${index ?? ''}`" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {{ field.label }}
      <span v-if="field.required" class="text-red-500">*</span>
    </label>
    <select
      :id="`${field.name}-${index ?? ''}`"
      :value="fieldValue(field.name)"
      @change="updateField(field.name, ($event.target as HTMLSelectElement).value)"
      @blur="onBlur(field)"
      :required="field.required"
      :aria-required="field.required || undefined"
      :aria-invalid="!!(field.name && touched[field.name!] && errors[field.name!]) || undefined"
      :aria-describedby="describedBy(field)"
      :class="['w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100', inputBorderClass(field)]"
    >
      <option
        v-for="option in resolvedOptions"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <p v-if="field.helpText" :id="helpId(field.name!)" class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ field.helpText }}</p>
    <p v-if="field.name && touched[field.name] && errors[field.name]" :id="errorId(field.name)" class="mt-1 text-sm text-red-600" role="alert">{{ errors[field.name] }}</p>
  </div>

  <!-- Currency -->
  <div
    v-else-if="field.type === 'currency' && field.name"
    :class="field.fullWidth ? 'col-span-1 md:col-span-2' : `col-span-1 md:col-span-${field.colSpan || 1}`"
  >
    <label :for="`${field.name}-${index ?? ''}`" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {{ field.label }}
      <span v-if="field.required" class="text-red-500">*</span>
    </label>
    <input
      :id="`${field.name}-${index ?? ''}`"
      type="text"
      :value="fieldValue(field.name)"
      @input="updateField(field.name, ($event.target as HTMLInputElement).value)"
      @blur="onBlur(field)"
      :placeholder="field.placeholder || '$0.00'"
      :required="field.required"
      :aria-required="field.required || undefined"
      :aria-invalid="!!(field.name && touched[field.name!] && errors[field.name!]) || undefined"
      :aria-describedby="describedBy(field)"
      :class="['w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100', inputBorderClass(field)]"
    />
    <label
      v-if="field.manualEntry"
      class="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400"
    >
      <input
        type="checkbox"
        :checked="fieldValue(getManualEntryFieldName(field))"
        @change="updateField(getManualEntryFieldName(field), ($event.target as HTMLInputElement).checked)"
        class="mr-2"
      />
      <span>Leave space in PDF for manual entry</span>
    </label>
    <p v-if="field.helpText" :id="helpId(field.name!)" class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ field.helpText }}</p>
    <p v-if="field.name && touched[field.name] && errors[field.name]" :id="errorId(field.name)" class="mt-1 text-sm text-red-600" role="alert">{{ errors[field.name] }}</p>
  </div>

  <!-- Date -->
  <div
    v-else-if="field.type === 'date' && field.name"
    :class="field.fullWidth ? 'col-span-1 md:col-span-2' : `col-span-1 md:col-span-${field.colSpan || 1}`"
  >
    <label :for="`${field.name}-${index ?? ''}`" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {{ field.label }}
      <span v-if="field.required" class="text-red-500">*</span>
    </label>
    <input
      :id="`${field.name}-${index ?? ''}`"
      type="date"
      :value="fieldValue(field.name)"
      @input="updateField(field.name, ($event.target as HTMLInputElement).value)"
      @blur="onBlur(field)"
      :required="field.required"
      :aria-required="field.required || undefined"
      :aria-invalid="!!(field.name && touched[field.name!] && errors[field.name!]) || undefined"
      :aria-describedby="describedBy(field)"
      :class="['w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100', inputBorderClass(field)]"
    />
    <p v-if="field.helpText" :id="helpId(field.name!)" class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ field.helpText }}</p>
    <p v-if="field.name && touched[field.name] && errors[field.name]" :id="errorId(field.name)" class="mt-1 text-sm text-red-600" role="alert">{{ errors[field.name] }}</p>
  </div>

  <!-- Checkbox -->
  <div
    v-else-if="field.type === 'checkbox' && field.name"
    :class="field.fullWidth ? 'col-span-1 md:col-span-2' : `col-span-1 md:col-span-${field.colSpan || 1}`"
  >
    <label class="flex items-center">
      <input
        :id="`${field.name}-${index ?? ''}`"
        type="checkbox"
        :checked="fieldValue(field.name)"
        @change="updateField(field.name, ($event.target as HTMLInputElement).checked)"
        :aria-required="field.required || undefined"
        :aria-describedby="describedBy(field)"
        class="mr-2"
      />
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ field.label }}
        <span v-if="field.required" class="text-red-500">*</span>
      </span>
    </label>
    <p v-if="field.helpText" :id="helpId(field.name!)" class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ field.helpText }}</p>
  </div>

  <!-- Radio -->
  <div
    v-else-if="field.type === 'radio' && field.name"
    :class="field.fullWidth ? 'col-span-1 md:col-span-2' : `col-span-1 md:col-span-${field.colSpan || 1}`"
    role="radiogroup"
    :aria-labelledby="`${field.name}-${index ?? ''}-label`"
  >
    <label :id="`${field.name}-${index ?? ''}-label`" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {{ field.label }}
      <span v-if="field.required" class="text-red-500">*</span>
    </label>
    <div class="flex gap-4">
      <label
        v-for="option in resolvedOptions"
        :key="option.value"
        class="flex items-center"
      >
        <input
          type="radio"
          :name="`${field.name}-${index ?? ''}`"
          :value="option.value"
          :checked="fieldValue(field.name) === option.value"
          @change="updateField(field.name, option.value)"
          :aria-required="field.required || undefined"
          class="mr-2"
        />
        <span>{{ option.label }}</span>
      </label>
    </div>
    <p v-if="field.helpText" :id="helpId(field.name!)" class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ field.helpText }}</p>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import type { FormFieldSchema } from '@/models/FormSchema'
import { useLegacyStore } from '@/store'
import BeneficiarySelector from './BeneficiarySelector.vue'
import TrustSelector from './TrustSelector.vue'
import PersonSelector from './PersonSelector.vue'
import RecoveryInstructionsButton from './RecoveryInstructionsButton.vue'
import DynamicForm from './DynamicForm.vue'

const props = defineProps<{
  field: FormFieldSchema
  modelValue: any
  index?: number
}>()

const store = useLegacyStore()

/**
 * Resolve options for select/radio fields.
 * If the field has `optionsFrom`, compute options dynamically from store data.
 * Otherwise, fall back to static `options`.
 */
const resolvedOptions = computed(() => {
  const field = props.field
  if (field.optionsFrom && store.data) {
    const { source, labelField, valueField, filter } = field.optionsFrom
    const parts = source.split('.')
    let items: any = store.data
    for (const part of parts) {
      if (items == null) return field.options || []
      items = (items as any)[part]
    }
    if (!Array.isArray(items)) return field.options || []
    const filtered = filter ? items.filter(filter) : items
    return filtered.map((item: any) => ({
      label: item[labelField] || '',
      value: item[valueField] || '',
    }))
  }
  return field.options || []
})

// --- Visibility toggle for password fields ---
const passwordVisible: Record<string, boolean> = reactive({})

// --- Validation state ---
const touched: Record<string, boolean> = reactive({})
const errors: Record<string, string> = reactive({})

function fieldId(name: string): string {
  return `${name}-${props.index ?? ''}`
}

function errorId(name: string): string {
  return `${fieldId(name)}-error`
}

function helpId(name: string): string {
  return `${fieldId(name)}-help`
}

function describedBy(field: FormFieldSchema): string | undefined {
  if (!field.name) return undefined
  const parts: string[] = []
  if (errors[field.name]) parts.push(errorId(field.name))
  if (field.helpText) parts.push(helpId(field.name))
  return parts.length > 0 ? parts.join(' ') : undefined
}

function validateField(field: FormFieldSchema): void {
  if (!field.name || !field.validation) return
  const value = fieldValue(field.name)
  const v = field.validation

  // Pattern validation
  if (v.pattern) {
    const regex = new RegExp(v.pattern)
    if (value && !regex.test(String(value))) {
      errors[field.name] = v.message || `Invalid format`
      return
    }
  }

  // Min/max validation
  if (v.min !== undefined || v.max !== undefined) {
    if (field.type === 'number' || field.type === 'currency') {
      const num = Number(value)
      if (value !== '' && !isNaN(num)) {
        if (v.min !== undefined && num < v.min) {
          errors[field.name] = v.message || `Must be at least ${v.min}`
          return
        }
        if (v.max !== undefined && num > v.max) {
          errors[field.name] = v.message || `Must be at most ${v.max}`
          return
        }
      }
    } else {
      const len = String(value || '').length
      if (len > 0) {
        if (v.min !== undefined && len < v.min) {
          errors[field.name] = v.message || `Must be at least ${v.min} characters`
          return
        }
        if (v.max !== undefined && len > v.max) {
          errors[field.name] = v.message || `Must be at most ${v.max} characters`
          return
        }
      }
    }
  }

  // Clear error if valid
  delete errors[field.name]
}

function onBlur(field: FormFieldSchema): void {
  if (!field.name) return
  touched[field.name] = true
  validateField(field)
}

function inputBorderClass(field: FormFieldSchema): string {
  if (field.name && touched[field.name] && errors[field.name]) {
    return 'border-red-500'
  }
  return 'border-gray-300'
}

const emit = defineEmits<{
  'update:field': [fieldName: string, value: any]
}>()

function fieldValue(fieldName: string): any {
  // Support nested paths like "singleKey.walletLabel"
  const parts = fieldName.split('.')
  let value = props.modelValue
  for (const part of parts) {
    if (value == null) break
    value = value[part]
  }
  
  // For custom components that expect arrays (like BeneficiarySelector), return empty array if undefined
  // Also handle array type fields
  const field = props.field
  if ((field.component === 'BeneficiarySelector' || field.type === 'array') && (value === undefined || value === null || value === '')) {
    return []
  }
  return value ?? ''
}

function updateField(fieldName: string, value: any) {
  emit('update:field', fieldName, value)
}

function removeArrayItem(fieldName: string, index: number) {
  const currentArray = fieldValue(fieldName) || []
  const newArray = [...currentArray]
  newArray.splice(index, 1)
  updateField(fieldName, newArray)
}

function getManualEntryFieldName(field: FormFieldSchema): string {
  if (!field.name) {
    throw new Error('Field name is required for manual entry')
  }
  return field.manualEntryFieldName || `${field.name}ManualEntry`
}

function getComponent(componentName: string) {
  const components: Record<string, any> = {
    BeneficiarySelector,
    TrustSelector,
    PersonSelector,
    RecoveryInstructionsButton,
  }
  return components[componentName] || 'div'
}
</script>

