<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="photosAndMediaSchema.title"
      :description="photosAndMediaSchema.description"
      :schema="photosAndMediaSchema"
      :form-data="photosAndMedia"
    />

    <div class="bg-white rounded-lg shadow p-6">
      <DynamicForm
        :schema="photosAndMediaSchema"
        :model-value="photosAndMedia"
        @update:model-value="photosAndMedia = $event"
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
import { photosAndMediaSchema } from '@/schemas/photosAndMedia.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const photosAndMedia = ref<Record<string, any>>({})
const { markClean, initialize } = useUnsavedChanges(photosAndMedia)

function loadFormData() {
  if (store.data?.photosAndMedia) {
    photosAndMedia.value = { ...store.data.photosAndMedia }
  } else {
    photosAndMedia.value = {}
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.photosAndMedia, loadFormData, { deep: true })
})

async function save() {
  try {
    await store.updateData({ photosAndMedia: photosAndMedia.value })
    showToast('Photos & media saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

