<template>
  <div class="space-y-4">
    <template v-for="(group, groupIndex) in fieldGroups" :key="groupIndex">
      <!-- Expandable Section (from expandableSectionId) -->
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

      <!-- Collapsible Section Divider -->
      <div
        v-else-if="group.isCollapsibleDivider"
        :class="group.showBorder !== false ? 'border-t border-gray-200 dark:border-gray-600 pt-3 mt-2' : 'pt-2'"
      >
        <button
          type="button"
          @click="toggleSection(group.collapseKey!, group.defaultExpanded === false)"
          class="w-full flex items-center justify-between text-left mb-3 group hover:opacity-80 transition-opacity"
        >
          <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {{ group.label }}
          </h4>
          <svg
            class="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform"
            :class="{ 'rotate-180': !isCollapsed(group.collapseKey!, group.defaultExpanded === false) }"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <div
          v-show="!isCollapsed(group.collapseKey!, group.defaultExpanded === false)"
          class="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <template v-for="(field, fieldIndex) in group.fields" :key="field.name || `field-${fieldIndex}`">
            <FieldRenderer
              :field="field"
              :model-value="modelValue"
              :index="index"
              @update:field="updateField"
            />
          </template>
        </div>
      </div>

      <!-- Regular Fields Group -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <template v-for="(field, fieldIndex) in group.fields" :key="field.name || `divider-${fieldIndex}`">
          <!-- Section Divider (non-collapsible) -->
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
import { useCollapsedSections } from '@/composables/useCollapsedSections'

const props = defineProps<{
  schema: FormSectionSchema
  modelValue: any
  index?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const { isCollapsed, setCollapsed } = useCollapsedSections()

function toggleSection(key: string, defaultCollapsed: boolean) {
  // When toggling, look up current state (respecting default) and flip
  const currentlyCollapsed = isCollapsed(key, defaultCollapsed)
  setCollapsed(key, !currentlyCollapsed)
}

const visibleFields = computed(() => {
  return getVisibleFields(props.schema.fields, props.modelValue)
})

type FieldGroup = {
  isExpandable: boolean
  isCollapsibleDivider?: boolean
  label?: string
  defaultExpanded?: boolean
  showBorder?: boolean
  collapseKey?: string
  fields: FormFieldSchema[]
  expandableId?: string
}

// Group fields by section dividers (collapsible) and expandable sections
const fieldGroups = computed(() => {
  const groups: FieldGroup[] = []
  let currentGroup: FieldGroup | null = null

  function flush() {
    if (currentGroup && currentGroup.fields.length > 0) {
      groups.push(currentGroup)
    }
    currentGroup = null
  }

  visibleFields.value.forEach(field => {
    // Section divider
    if (field.sectionDivider && (!field.name || field.name.startsWith('_'))) {
      flush()

      if (field.sectionDivider.collapsible) {
        // Start a new collapsible group — subsequent fields belong to it until next divider
        currentGroup = {
          isExpandable: false,
          isCollapsibleDivider: true,
          label: field.sectionDivider.label,
          defaultExpanded: field.sectionDivider.defaultExpanded ?? true,
          showBorder: field.sectionDivider.showBorder,
          collapseKey: `${props.schema.sectionKey}.${field.sectionDivider.label || 'section'}`,
          fields: [],
        }
      } else {
        // Non-collapsible divider — render as a one-field group like before
        groups.push({ isExpandable: false, fields: [field] })
      }
      return
    }

    // Expandable section (from expandableSectionId)
    if (field.expandableSectionId) {
      if (!currentGroup || currentGroup.expandableId !== field.expandableSectionId) {
        flush()
        currentGroup = {
          isExpandable: true,
          label: field.expandableSectionLabel || field.label || '',
          defaultExpanded: field.expandableSectionDefaultExpanded ?? false,
          fields: [field],
          expandableId: field.expandableSectionId,
        }
      } else {
        currentGroup.fields.push(field)
      }
      return
    }

    // Regular field
    if (!currentGroup || (currentGroup.isExpandable && !currentGroup.isCollapsibleDivider)) {
      // If we were in an expandableSectionId group, flush and start a new plain group
      flush()
      currentGroup = { isExpandable: false, fields: [] }
    }
    currentGroup.fields.push(field)
  })

  flush()
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
      const parts = targetField.split('.')
      let currentValue = props.modelValue
      for (const part of parts) {
        if (currentValue == null) break
        currentValue = currentValue[part]
      }
      if (currentValue) return

      const transformedValue = transform ? transform(newVal) : newVal
      updateField(targetField, transformedValue)
    },
    { immediate: false }
  )
})

function updateField(fieldName: string, value: any) {
  const parts = fieldName.split('.')
  if (parts.length === 1) {
    emit('update:modelValue', {
      ...props.modelValue,
      [fieldName]: value,
    })
  } else {
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
