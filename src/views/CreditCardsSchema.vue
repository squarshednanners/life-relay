<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="creditCardsSchema.title"
      :description="creditCardsSchema.description"
      :schema="creditCardsSchema"
      :form-data="creditCards"
    />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <DynamicForm
        :schema="creditCardsSchema"
        :model-value="creditCards"
        @update:model-value="creditCards = $event"
        @remove="removeCreditCard"
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
import { creditCardsSchema } from '@/schemas/creditCards.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const creditCards = ref<Record<string, any>[]>([])
const { markClean, initialize } = useUnsavedChanges(creditCards)

function loadFormData() {
  if (store.data?.creditCards) {
    creditCards.value = [...(store.data.creditCards as Record<string, any>[])]
  } else {
    creditCards.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.creditCards, loadFormData, { deep: true })
})

function removeCreditCard(index: number) {
  creditCards.value.splice(index, 1)
}

async function save() {
  try {
    await store.updateData({ creditCards: creditCards.value })
    showToast('Credit cards saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

