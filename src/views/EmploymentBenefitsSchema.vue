<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="employmentBenefitsSchema.title"
      :description="employmentBenefitsSchema.description"
      :schema="employmentBenefitsSchema"
      :form-data="employmentList"
    />

    <div class="bg-white rounded-lg shadow p-6">
      <DynamicForm
        :schema="enhancedSchema"
        :model-value="employmentList"
        @update:model-value="employmentList = $event"
        @remove="removeEmployment"
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
import { ref, computed, onMounted, watch } from 'vue'
import { useLegacyStore } from '@/store'
import { useToast } from '@/composables/useToast'
import SectionHeader from '@/components/SectionHeader.vue'
import DynamicForm from '@/components/DynamicForm.vue'
import { employmentBenefitsSchema } from '@/schemas/employmentBenefits.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const employmentList = ref<Record<string, any>[]>([])
const { markClean, initialize } = useUnsavedChanges(employmentList)

function getPersonName(personId: string): string {
  const person = store.data?.people?.find((p: any) => p.id === personId)
  return person?.name || 'Unknown'
}

// Update arrayItemLabel to show person name
const enhancedSchema = computed(() => ({
  ...employmentBenefitsSchema,
  arrayItemLabel: (index: number, item: any) => {
    return getPersonName(item.personId) || `Employment ${index + 1}`
  },
}))

function loadFormData() {
  if (store.data?.employmentBenefits) {
    employmentList.value = [...(store.data.employmentBenefits as Record<string, any>[])]
  } else {
    employmentList.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.employmentBenefits, loadFormData, { deep: true })
})

function removeEmployment(index: number) {
  employmentList.value.splice(index, 1)
}

async function save() {
  try {
    await store.updateData({ employmentBenefits: employmentList.value as any })
    showToast('Employment benefits saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

