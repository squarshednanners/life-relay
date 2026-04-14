<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="businessOwnershipSchema.title"
      :description="businessOwnershipSchema.description"
      :schema="businessOwnershipSchema"
      :form-data="businesses"
    />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <DynamicForm
        :schema="businessOwnershipSchema"
        :model-value="businesses"
        @update:model-value="businesses = $event"
        @remove="removeBusiness"
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
import { businessOwnershipSchema } from '@/schemas/businessOwnership.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const businesses = ref<Record<string, any>[]>([])
const { markClean, initialize } = useUnsavedChanges(businesses)

function loadFormData() {
  if (store.data?.businessOwnership) {
    businesses.value = [...(store.data.businessOwnership as Record<string, any>[])]
  } else {
    businesses.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.businessOwnership, loadFormData, { deep: true })
})

function removeBusiness(index: number) {
  businesses.value.splice(index, 1)
}

async function save() {
  try {
    await store.updateData({ businessOwnership: businesses.value })
    showToast('Business ownership saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

