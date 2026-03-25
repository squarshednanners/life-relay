<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="financialAccountsSchema.title"
      :description="financialAccountsSchema.description"
      :schema="financialAccountsSchema"
      :form-data="accounts"
    />

    <div class="bg-white rounded-lg shadow p-6">
      <DynamicForm
        :schema="financialAccountsSchema"
        :model-value="accounts"
        @update:model-value="accounts = $event"
        @remove="removeAccount"
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
import { financialAccountsSchema } from '@/schemas/financialAccounts.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
// Data structure is defined by the schema, not a static TypeScript interface
const accounts = ref<Record<string, any>[]>([])
const { markClean, initialize } = useUnsavedChanges(accounts)

function loadFormData() {
  if (store.data?.financialAccounts) {
    accounts.value = [...(store.data.financialAccounts as Record<string, any>[])]
  } else {
    accounts.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.financialAccounts, loadFormData, { deep: true })
})

function removeAccount(index: number) {
  accounts.value.splice(index, 1)
}

async function save() {
  try {
    await store.updateData({ financialAccounts: accounts.value })
    showToast('Financial accounts saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

