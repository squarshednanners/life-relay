<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="taxInfoSchema.title"
      :description="taxInfoSchema.description"
      :schema="taxInfoSchema"
      :form-data="taxInfo"
    />

    <div class="bg-white rounded-lg shadow p-6">
      <DynamicForm
        :schema="taxInfoSchema"
        :model-value="taxInfo"
        @update:model-value="taxInfo = $event"
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
import { taxInfoSchema } from '@/schemas/taxInfo.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const taxInfo = ref<Record<string, any>>({})
const { markClean, initialize } = useUnsavedChanges(taxInfo)

function loadFormData() {
  if (store.data?.taxInfo) {
    taxInfo.value = { ...store.data.taxInfo }
  } else {
    taxInfo.value = {}
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.taxInfo, loadFormData, { deep: true })
})

async function save() {
  try {
    await store.updateData({ taxInfo: taxInfo.value })
    showToast('Tax information saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>
