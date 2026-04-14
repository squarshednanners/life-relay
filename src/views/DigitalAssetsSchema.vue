<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="digitalAssetsSchema.title"
      :description="digitalAssetsSchema.description"
      :schema="digitalAssetsSchema"
      :form-data="assets"
    />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <DynamicForm
        :schema="digitalAssetsSchema"
        :model-value="assets"
        @update:model-value="assets = $event"
        @remove="removeAsset"
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
import { digitalAssetsSchema } from '@/schemas/digitalAssets.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const assets = ref<Record<string, any>[]>([])
const { markClean, initialize } = useUnsavedChanges(assets)

function loadFormData() {
  if (store.data?.digitalAssets) {
    assets.value = [...(store.data.digitalAssets as Record<string, any>[])]
  } else {
    assets.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.digitalAssets, loadFormData, { deep: true })
})

function removeAsset(index: number) {
  assets.value.splice(index, 1)
}

async function save() {
  try {
    await store.updateData({ digitalAssets: assets.value })
    showToast('Digital assets saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

