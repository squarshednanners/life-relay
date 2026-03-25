<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="otherInsuranceSchema.title"
      :description="otherInsuranceSchema.description"
      :schema="otherInsuranceSchema"
      :form-data="otherInsurance"
    />

    <div class="bg-white rounded-lg shadow p-6">
      <DynamicForm
        :schema="otherInsuranceSchema"
        :model-value="otherInsurance"
        @update:model-value="otherInsurance = $event"
        @remove="removeItem"
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
import { otherInsuranceSchema } from '@/schemas/otherInsurance.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const otherInsurance = ref<any[]>([])
const { markClean, initialize } = useUnsavedChanges(otherInsurance)

function loadFormData() {
  if (store.data?.otherInsurance && Array.isArray(store.data.otherInsurance)) {
    otherInsurance.value = store.data.otherInsurance.map((item: any) => ({ ...item }))
  } else {
    otherInsurance.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.otherInsurance, loadFormData, { deep: true })
})

function removeItem(index: number) {
  otherInsurance.value.splice(index, 1)
  save()
}

async function save() {
  try {
    await store.updateData({ otherInsurance: otherInsurance.value })
    showToast('Other insurance saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>
