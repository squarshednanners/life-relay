<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="loyaltyProgramsSchema.title"
      :description="loyaltyProgramsSchema.description"
      :schema="loyaltyProgramsSchema"
      :form-data="loyaltyPrograms"
    />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <DynamicForm
        :schema="loyaltyProgramsSchema"
        :model-value="loyaltyPrograms"
        @update:model-value="loyaltyPrograms = $event"
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
import { loyaltyProgramsSchema } from '@/schemas/loyaltyPrograms.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const loyaltyPrograms = ref<any[]>([])
const { markClean, initialize } = useUnsavedChanges(loyaltyPrograms)

function loadFormData() {
  if (store.data?.loyaltyPrograms && Array.isArray(store.data.loyaltyPrograms)) {
    loyaltyPrograms.value = store.data.loyaltyPrograms.map((item: any) => ({ ...item }))
  } else {
    loyaltyPrograms.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.loyaltyPrograms, loadFormData, { deep: true })
})

function removeItem(index: number) {
  loyaltyPrograms.value.splice(index, 1)
  save()
}

async function save() {
  try {
    await store.updateData({ loyaltyPrograms: loyaltyPrograms.value })
    showToast('Loyalty programs saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>
