<template>
  <div class="space-y-4">
    <template v-for="(group, groupIndex) in fieldGroups" :key="groupIndex">
      <!-- Expandable Section -->
      <ExpandableSection
        v-if="group.isExpandable && group.label"
        :label="group.label || ''"
        :default-expanded="group.defaultExpanded"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <template v-for="(field, fieldIndex) in group.fields" :key="field.name || `divider-${fieldIndex}`">
            <FieldRenderer
              :field="field"
              :model-value="modelValue"
              :index="index"
              @update:field="updateField"
            />
          </template>
        </div>
      </ExpandableSection>

      <!-- Regular Fields Group -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <template v-for="(field, fieldIndex) in group.fields" :key="field.name || `divider-${fieldIndex}`">
          <!-- Section Divider -->
          <template v-if="field.sectionDivider && (!field.name || field.name.startsWith('_'))">
            <div
              :class="field.sectionDivider.showBorder !== false ? 'col-span-1 md:col-span-2 border-t border-gray-200 dark:border-gray-600 pt-4 mt-2' : 'col-span-1 md:col-span-2 pt-2'"
            >
              <h4 v-if="field.sectionDivider.label" class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                {{ field.sectionDivider.label }}
              </h4>
            </div>
          </template>

          <!-- Regular Field -->
          <FieldRenderer
            v-else-if="!field.sectionDivider || (field.name && !field.name.startsWith('_'))"
            :field="field"
            :model-value="modelValue"
            :index="index"
            @update:field="updateField"
          />
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import type { FormSectionSchema, FormFieldSchema } from '@/models/FormSchema'
import { getVisibleFields } from '@/models/FormSchema'
import ExpandableSection from './ExpandableSection.vue'
import FieldRenderer from './FieldRenderer.vue'

const props = defineProps<{
  schema: FormSectionSchema
  modelValue: any
  index?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const visibleFields = computed(() => {
  return getVisibleFields(props.schema.fields, props.modelValue)
})

// Helper type for field groups
type FieldGroupWithId = {
  isExpandable: boolean
  label?: string
  defaultExpanded?: boolean
  fields: FormFieldSchema[]
  expandableId?: string
}

// Group fields by expandable sections
const fieldGroups = computed(() => {
  const groups: Array<{
    isExpandable: boolean
    label?: string
    defaultExpanded?: boolean
    fields: FormFieldSchema[]
  }> = []
  
  let currentGroup: FieldGroupWithId | null = null

  visibleFields.value.forEach(field => {
    // Skip section dividers in grouping (they'll be rendered separately)
    if (field.sectionDivider && (!field.name || field.name.startsWith('_'))) {
      // Save current group if exists
      if (currentGroup && currentGroup.fields.length > 0) {
        groups.push({
          isExpandable: currentGroup.isExpandable,
          label: currentGroup.label,
          defaultExpanded: currentGroup.defaultExpanded,
          fields: currentGroup.fields,
        })
        currentGroup = null
      }
      // Add divider as its own group
      groups.push({
        isExpandable: false,
        fields: [field],
      })
      return
    }

    // Check if field belongs to an expandable section
    if (field.expandableSectionId) {
      // If starting a new expandable section
      if (!currentGroup || currentGroup.expandableId !== field.expandableSectionId) {
        // Save previous group if exists
        if (currentGroup && currentGroup.fields.length > 0) {
          groups.push({
            isExpandable: currentGroup.isExpandable,
            label: currentGroup.label,
            defaultExpanded: currentGroup.defaultExpanded,
            fields: currentGroup.fields,
          })
        }
        // Start new expandable group
        currentGroup = {
          isExpandable: true,
          label: field.expandableSectionLabel || field.label || '',
          defaultExpanded: field.expandableSectionDefaultExpanded ?? false,
          fields: [field],
          expandableId: field.expandableSectionId,
        }
      } else {
        // Add to current expandable group
        currentGroup.fields.push(field)
      }
    } else {
      // Regular field (not in expandable section)
      // Save previous expandable group if exists
      if (currentGroup && currentGroup.isExpandable) {
        groups.push({
          isExpandable: true,
          label: currentGroup.label,
          defaultExpanded: currentGroup.defaultExpanded,
          fields: currentGroup.fields,
        })
        currentGroup = null
      }
      
      // Add to regular group
      if (!currentGroup || currentGroup.isExpandable) {
        currentGroup = {
          isExpandable: false,
          fields: [],
        }
      }
      currentGroup.fields.push(field)
    }
  })

  // Add last group
  if (currentGroup) {
    const group: FieldGroupWithId = currentGroup
    if (group.fields.length > 0) {
      groups.push({
        isExpandable: group.isExpandable,
        label: group.label,
        defaultExpanded: group.defaultExpanded,
        fields: group.fields,
      })
    }
  }

  return groups
})

// Field dependencies: watch source fields and auto-populate dependent fields
const dependentFields = computed(() =>
  props.schema.fields.filter(f => f.dependsOn && f.name)
)

dependentFields.value.forEach(field => {
  if (!field.dependsOn || !field.name) return
  const sourceField = field.dependsOn.field
  const targetField = field.name
  const transform = field.dependsOn.transform

  watch(
    () => {
      const parts = sourceField.split('.')
      let value = props.modelValue
      for (const part of parts) {
        if (value == null) return undefined
        value = value[part]
      }
      return value
    },
    (newVal) => {
      if (newVal == null) return
      // Only auto-populate if the dependent field is currently empty
      const parts = targetField.split('.')
      let currentValue = props.modelValue
      for (const part of parts) {
        if (currentValue == null) break
        currentValue = currentValue[part]
      }
      if (currentValue) return // Don't overwrite non-empty values

      const transformedValue = transform ? transform(newVal) : newVal
      updateField(targetField, transformedValue)
    },
    { immediate: false }
  )
})

function updateField(fieldName: string, value: any) {
  // Support nested paths like "singleKey.walletLabel"
  const parts = fieldName.split('.')
  if (parts.length === 1) {
    // Simple field update
    emit('update:modelValue', {
      ...props.modelValue,
      [fieldName]: value,
    })
  } else {
    // Nested field update
    const newValue = { ...props.modelValue }
    let current: any = newValue
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {}
      } else {
        current[part] = { ...current[part] }
      }
      current = current[part]
    }
    current[parts[parts.length - 1]] = value
    emit('update:modelValue', newValue)
  }
}
</script>
