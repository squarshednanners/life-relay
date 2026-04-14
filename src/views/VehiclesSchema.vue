<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="vehiclesSchema.title"
      :description="vehiclesSchema.description"
      :schema="vehiclesSchema"
      :form-data="vehicles"
    />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <DynamicForm
        :schema="vehiclesSchema"
        :model-value="vehicles"
        @update:model-value="vehicles = $event"
        @remove="removeVehicle"
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
import { vehiclesSchema } from '@/schemas/vehicles.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const vehicles = ref<Record<string, any>[]>([])
const { markClean, initialize } = useUnsavedChanges(vehicles)

function loadFormData() {
  if (store.data?.vehicles) {
    vehicles.value = [...(store.data.vehicles as Record<string, any>[])]
  } else {
    vehicles.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.vehicles, loadFormData, { deep: true })
})

function removeVehicle(index: number) {
  vehicles.value.splice(index, 1)
}

async function save() {
  try {
    await store.updateData({ vehicles: vehicles.value })
    showToast('Vehicles saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

