<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="assetDocumentsSchema.title"
      :description="assetDocumentsSchema.description"
      :schema="assetDocumentsSchema"
      :form-data="documents"
    />

    <div class="bg-white rounded-lg shadow p-6">
      <DynamicForm
        :schema="assetDocumentsSchema"
        :model-value="documents"
        @update:model-value="documents = $event"
        @remove="removeDocument"
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
import { assetDocumentsSchema } from '@/schemas/assetDocuments.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const documents = ref<Record<string, any>[]>([])
const { markClean, initialize } = useUnsavedChanges(documents)

function loadFormData() {
  if (store.data?.assetDocuments) {
    documents.value = [...(store.data.assetDocuments as Record<string, any>[])]
  } else {
    documents.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.assetDocuments, loadFormData, { deep: true })
})

function removeDocument(index: number) {
  documents.value.splice(index, 1)
}

async function save() {
  try {
    await store.updateData({ assetDocuments: documents.value })
    showToast('Asset documents saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

