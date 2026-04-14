<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="utilitiesSchema.title"
      :description="utilitiesSchema.description"
      :schema="utilitiesSchema"
      :form-data="utilities"
    />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <DynamicForm
        :schema="utilitiesSchema"
        :model-value="utilities"
        @update:model-value="utilities = $event"
        @remove="removeUtility"
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
import { utilitiesSchema } from '@/schemas/utilities.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const utilities = ref<Record<string, any>[]>([])
const { markClean, initialize } = useUnsavedChanges(utilities)

function loadFormData() {
  if (store.data?.utilities) {
    utilities.value = [...(store.data.utilities as Record<string, any>[])]
  } else {
    utilities.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.utilities, loadFormData, { deep: true })
})

function removeUtility(index: number) {
  utilities.value.splice(index, 1)
}

async function save() {
  try {
    await store.updateData({ utilities: utilities.value })
    showToast('Utilities saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

