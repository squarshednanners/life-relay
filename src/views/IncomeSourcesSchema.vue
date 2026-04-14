<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="incomeSourcesSchema.title"
      :description="incomeSourcesSchema.description"
      :schema="incomeSourcesSchema"
      :form-data="incomeSources"
    />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <DynamicForm
        :schema="incomeSourcesSchema"
        :model-value="incomeSources"
        @update:model-value="incomeSources = $event"
        @remove="removeIncomeSource"
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
import { incomeSourcesSchema } from '@/schemas/incomeSources.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const incomeSources = ref<Record<string, any>[]>([])
const { markClean, initialize } = useUnsavedChanges(incomeSources)

function loadFormData() {
  if (store.data?.incomeSources) {
    incomeSources.value = [...(store.data.incomeSources as Record<string, any>[])]
  } else {
    incomeSources.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.incomeSources, loadFormData, { deep: true })
})

function removeIncomeSource(index: number) {
  incomeSources.value.splice(index, 1)
}

async function save() {
  try {
    await store.updateData({ incomeSources: incomeSources.value })
    showToast('Income sources saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

