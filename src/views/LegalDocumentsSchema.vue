<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="legalDocumentsSchema.title"
      :description="legalDocumentsSchema.description"
      :schema="legalDocumentsSchema"
      :form-data="legalDocuments"
    />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <DynamicForm
        :schema="legalDocumentsSchema"
        :model-value="legalDocuments"
        @update:model-value="legalDocuments = $event"
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
import { legalDocumentsSchema } from '@/schemas/legalDocuments.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const legalDocuments = ref<Record<string, any>>({})
const { markClean, initialize } = useUnsavedChanges(legalDocuments)

function loadFormData() {
  if (store.data?.legalDocuments) {
    legalDocuments.value = { ...store.data.legalDocuments }
  } else {
    legalDocuments.value = {}
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.legalDocuments, loadFormData, { deep: true })
})

async function save() {
  try {
    await store.updateData({ legalDocuments: legalDocuments.value })
    showToast('Legal documents saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

