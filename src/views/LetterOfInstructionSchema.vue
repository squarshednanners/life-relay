<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="letterOfInstructionSchema.title"
      :description="letterOfInstructionSchema.description"
      :schema="letterOfInstructionSchema"
      :form-data="letterOfInstruction"
    />

    <div class="bg-white rounded-lg shadow p-6">
      <DynamicForm
        :schema="letterOfInstructionSchema"
        :model-value="letterOfInstruction"
        @update:model-value="letterOfInstruction = $event"
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
import { letterOfInstructionSchema } from '@/schemas/letterOfInstruction.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const letterOfInstruction = ref<Record<string, any>>({})
const { markClean, initialize } = useUnsavedChanges(letterOfInstruction)

function loadFormData() {
  if (store.data?.letterOfInstruction) {
    letterOfInstruction.value = { ...store.data.letterOfInstruction }
  } else {
    letterOfInstruction.value = {}
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.letterOfInstruction, loadFormData, { deep: true })
})

async function save() {
  try {
    await store.updateData({ letterOfInstruction: letterOfInstruction.value })
    showToast('Letter of instruction saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

