<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="healthInsuranceSchema.title"
      :description="healthInsuranceSchema.description"
      :schema="healthInsuranceSchema"
      :form-data="healthInsurance"
    />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <DynamicForm
        :schema="healthInsuranceSchema"
        :model-value="healthInsurance"
        @update:model-value="healthInsurance = $event"
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
import { healthInsuranceSchema } from '@/schemas/healthInsurance.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const healthInsurance = ref<Record<string, any>>({})
const { markClean, initialize } = useUnsavedChanges(healthInsurance)

function loadFormData() {
  if (store.data?.healthInsurance) {
    healthInsurance.value = { ...store.data.healthInsurance }
  } else {
    healthInsurance.value = {}
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.healthInsurance, loadFormData, { deep: true })
})

async function save() {
  try {
    await store.updateData({ healthInsurance: healthInsurance.value })
    showToast('Health insurance saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

