<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="medicalInfoSchema.title"
      :description="medicalInfoSchema.description"
      :schema="medicalInfoSchema"
      :form-data="medicalInfoList"
    />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <DynamicForm
        :schema="enhancedSchema"
        :model-value="medicalInfoList"
        @update:model-value="medicalInfoList = $event"
        @remove="removeMedicalInfo"
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
import { medicalInfoSchema } from '@/schemas/medicalInfo.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const medicalInfoList = ref<Record<string, any>[]>([])
const { markClean, initialize } = useUnsavedChanges(medicalInfoList)

function getPersonName(personId: string): string {
  const person = store.data?.people?.find((p: any) => p.id === personId)
  return person?.name || 'Unknown'
}

// Update arrayItemLabel to show person name
const enhancedSchema = computed(() => ({
  ...medicalInfoSchema,
  arrayItemLabel: (index: number, item: any) => {
    return getPersonName(item.personId) || `Medical Info ${index + 1}`
  },
}))

function loadFormData() {
  if (store.data?.medicalInfo) {
    medicalInfoList.value = [...(store.data.medicalInfo as Record<string, any>[])]
  } else {
    medicalInfoList.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.medicalInfo, loadFormData, { deep: true })
})

function removeMedicalInfo(index: number) {
  medicalInfoList.value.splice(index, 1)
}

async function save() {
  try {
    await store.updateData({ medicalInfo: medicalInfoList.value as any })
    showToast('Medical information saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

