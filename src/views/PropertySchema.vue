<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="propertySchema.title"
      :description="propertySchema.description"
      :schema="propertySchema"
      :form-data="properties"
    />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <DynamicForm
        :schema="propertySchema"
        :model-value="properties"
        @update:model-value="properties = $event"
        @remove="removeProperty"
      />

      <div class="mt-6 flex gap-4">
        <button
          @click="save"
          class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useLegacyStore } from '@/store'
import { useToast } from '@/composables/useToast'
import SectionHeader from '@/components/SectionHeader.vue'
import DynamicForm from '@/components/DynamicForm.vue'
import { propertySchema } from '@/schemas/property.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const properties = ref<Record<string, any>[]>([])
const { markClean, initialize } = useUnsavedChanges(properties)

function loadFormData() {
  if (store.data?.property) {
    properties.value = [...(store.data.property as Record<string, any>[])]
  } else {
    properties.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.property, loadFormData, { deep: true })
})

function removeProperty(index: number) {
  properties.value.splice(index, 1)
}

async function save() {
  try {
    await store.updateData({ property: properties.value })
    showToast('Property information saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

