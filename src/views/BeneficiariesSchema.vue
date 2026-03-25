<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="beneficiariesSchema.title"
      :description="beneficiariesSchema.description"
      :schema="beneficiariesSchema"
      :form-data="beneficiaries"
    />

    <div class="bg-white rounded-lg shadow p-6">
      <DynamicForm
        :schema="beneficiariesSchema"
        :model-value="beneficiaries"
        @update:model-value="beneficiaries = $event"
        @remove="removeBeneficiary"
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
import { beneficiariesSchema } from '@/schemas/beneficiaries.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const beneficiaries = ref<Record<string, any>[]>([])
const { markClean, initialize } = useUnsavedChanges(beneficiaries)

function loadFormData() {
  if (store.data?.beneficiaries) {
    beneficiaries.value = [...(store.data.beneficiaries as Record<string, any>[])]
  } else {
    beneficiaries.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.beneficiaries, loadFormData, { deep: true })
})

function removeBeneficiary(index: number) {
  beneficiaries.value.splice(index, 1)
}

async function save() {
  try {
    await store.updateData({ beneficiaries: beneficiaries.value as any })
    showToast('Beneficiaries saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

