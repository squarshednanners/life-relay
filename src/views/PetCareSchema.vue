<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="petCareSchema.title"
      :description="petCareSchema.description"
      :schema="petCareSchema"
      :form-data="petCare"
    />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <DynamicForm
        :schema="petCareSchema"
        :model-value="petCare"
        @update:model-value="petCare = $event"
      />

      <!-- Note: Pets array would need special handling - for now, keeping it simple -->
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
import { petCareSchema } from '@/schemas/petCare.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const petCare = ref<Record<string, any>>({})
const { markClean, initialize } = useUnsavedChanges(petCare)

function loadFormData() {
  if (store.data?.petCare) {
    petCare.value = { ...store.data.petCare }
  } else {
    petCare.value = {}
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.petCare, loadFormData, { deep: true })
})

async function save() {
  try {
    await store.updateData({ petCare: petCare.value })
    showToast('Pet care information saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

