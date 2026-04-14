<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="authenticatorAppsSchema.title"
      :description="authenticatorAppsSchema.description"
      :schema="authenticatorAppsSchema"
      :form-data="apps"
    />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <DynamicForm
        :schema="authenticatorAppsSchema"
        :model-value="apps"
        @update:model-value="apps = $event"
        @remove="removeApp"
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
import { authenticatorAppsSchema } from '@/schemas/authenticatorApps.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
// Data structure is defined by the schema, not a static TypeScript interface
const apps = ref<Record<string, any>[]>([])
const { markClean, initialize } = useUnsavedChanges(apps)

function loadFormData() {
  if (store.data?.authenticatorApps) {
    apps.value = [...(store.data.authenticatorApps as Record<string, any>[])]
  } else {
    apps.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.authenticatorApps, loadFormData, { deep: true })
})

function removeApp(index: number) {
  apps.value.splice(index, 1)
}

async function save() {
  try {
    await store.updateData({ authenticatorApps: apps.value })
    showToast('Authenticator apps saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

