<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="finalWishesAndServicesSchema.title"
      :description="finalWishesAndServicesSchema.description"
      :schema="finalWishesAndServicesSchema"
      :form-data="wishesList"
    />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <DynamicForm
        :schema="enhancedSchema"
        :model-value="wishesList"
        @update:model-value="wishesList = $event"
        @remove="removeEntry"
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
import { finalWishesAndServicesSchema } from '@/schemas/finalWishesAndServices.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const wishesList = ref<Record<string, any>[]>([])
const { markClean, initialize } = useUnsavedChanges(wishesList)

function getPersonName(personId: string): string {
  const person = store.data?.people?.find((p: any) => p.id === personId)
  return person?.name || 'Unknown'
}

const enhancedSchema = computed(() => ({
  ...finalWishesAndServicesSchema,
  arrayItemLabel: (index: number, item: any) => {
    if (item.personId) return getPersonName(item.personId)
    return `Final Wishes ${index + 1}`
  },
}))

function loadFormData() {
  if (store.data?.finalWishesAndServices) {
    wishesList.value = [...(store.data.finalWishesAndServices as Record<string, any>[])]
  } else {
    wishesList.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.finalWishesAndServices, loadFormData, { deep: true })
})

function removeEntry(index: number) {
  wishesList.value.splice(index, 1)
}

async function save() {
  try {
    await store.updateData({ finalWishesAndServices: wishesList.value as any })
    showToast('Final wishes saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>
