<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="phonesSchema.title"
      :description="phonesSchema.description"
      :schema="phonesSchema"
      :form-data="phones"
    />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <DynamicForm
        :schema="phonesSchema"
        :model-value="phones"
        @update:model-value="phones = $event"
        @remove="removePhone"
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
import { phonesSchema } from '@/schemas/phones.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
// Data structure is defined by the schema, not a static TypeScript interface
const phones = ref<Record<string, any>[]>([])
const { markClean, initialize } = useUnsavedChanges(phones)

function loadFormData() {
  if (store.data?.phones) {
    phones.value = [...(store.data.phones as Record<string, any>[])]
  } else {
    phones.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.phones, loadFormData, { deep: true })
})

function removePhone(index: number) {
  phones.value.splice(index, 1)
}

async function save() {
  try {
    await store.updateData({ phones: phones.value })
    showToast('Phone information saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

