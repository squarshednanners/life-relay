<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="debtsSchema.title"
      :description="debtsSchema.description"
      :schema="debtsSchema"
      :form-data="debts"
    />

    <div class="bg-white rounded-lg shadow p-6">
      <DynamicForm
        :schema="debtsSchema"
        :model-value="debts"
        @update:model-value="debts = $event"
        @remove="removeDebt"
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
import { debtsSchema } from '@/schemas/debts.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const debts = ref<Record<string, any>[]>([])
const { markClean, initialize } = useUnsavedChanges(debts)

function loadFormData() {
  if (store.data?.debts) {
    debts.value = [...(store.data.debts as Record<string, any>[])]
  } else {
    debts.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.debts, loadFormData, { deep: true })
})

function removeDebt(index: number) {
  debts.value.splice(index, 1)
}

async function save() {
  try {
    await store.updateData({ debts: debts.value })
    showToast('Debts saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

