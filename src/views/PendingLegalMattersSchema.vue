<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="pendingLegalMattersSchema.title"
      :description="pendingLegalMattersSchema.description"
      :schema="pendingLegalMattersSchema"
      :form-data="pendingLegalMatters"
    />

    <div class="bg-white rounded-lg shadow p-6">
      <DynamicForm
        :schema="pendingLegalMattersSchema"
        :model-value="pendingLegalMatters"
        @update:model-value="pendingLegalMatters = $event"
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
import { pendingLegalMattersSchema } from '@/schemas/pendingLegalMatters.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const pendingLegalMatters = ref<any[]>([])
const { markClean, initialize } = useUnsavedChanges(pendingLegalMatters)

function loadFormData() {
  if (store.data?.pendingLegalMatters && Array.isArray(store.data.pendingLegalMatters)) {
    pendingLegalMatters.value = store.data.pendingLegalMatters.map((item: any) => ({ ...item }))
  } else {
    pendingLegalMatters.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.pendingLegalMatters, loadFormData, { deep: true })
})

function removeItem(index: number) {
  pendingLegalMatters.value.splice(index, 1)
  save()
}

async function save() {
  try {
    await store.updateData({ pendingLegalMatters: pendingLegalMatters.value })
    showToast('Pending legal matters saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>
