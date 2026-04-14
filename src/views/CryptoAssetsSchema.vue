<template>
  <div class="max-w-4xl">
    <SectionHeader
      :title="cryptoAssetsSchema.title"
      :description="cryptoAssetsSchema.description"
      :schema="cryptoAssetsSchema"
      :form-data="assets"
    />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <DynamicForm
        :schema="cryptoAssetsSchema"
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
import { cryptoAssetsSchema } from '@/schemas/cryptoAssets.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
// Data structure is defined by the schema, not a static TypeScript interface
const assets = ref<Record<string, any>[]>([])
const { markClean, initialize } = useUnsavedChanges(assets)

function loadFormData() {
  if (store.data?.cryptoAssets) {
    assets.value = [...(store.data.cryptoAssets as Record<string, any>[])]
  } else {
    assets.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.cryptoAssets, loadFormData, { deep: true })
})

function removeAsset(index: number) {
  assets.value.splice(index, 1)
}

async function save() {
  try {
    await store.updateData({ cryptoAssets: assets.value })
    showToast('Crypto assets saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

