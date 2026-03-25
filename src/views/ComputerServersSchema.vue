<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="computerServersSchema.title"
      :description="computerServersSchema.description"
      :schema="computerServersSchema"
      :form-data="computers"
    />

    <div class="bg-white rounded-lg shadow p-6">
      <DynamicForm
        :schema="computerServersSchema"
        :model-value="computers"
        @update:model-value="computers = $event"
        @remove="removeComputer"
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
import { computerServersSchema } from '@/schemas/computerServers.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
// Data structure is defined by the schema, not a static TypeScript interface
const computers = ref<Record<string, any>[]>([])
const { markClean, initialize } = useUnsavedChanges(computers)

function loadFormData() {
  if (store.data?.computerServers) {
    computers.value = [...(store.data.computerServers as Record<string, any>[])]
  } else {
    computers.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.computerServers, loadFormData, { deep: true })
})

function removeComputer(index: number) {
  computers.value.splice(index, 1)
}

async function save() {
  try {
    await store.updateData({ computerServers: computers.value })
    showToast('Computer/Server information saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

