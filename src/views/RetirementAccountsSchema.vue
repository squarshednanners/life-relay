<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="retirementAccountsSchema.title"
      :description="retirementAccountsSchema.description"
      :schema="retirementAccountsSchema"
      :form-data="accounts"
    />

    <div class="bg-white rounded-lg shadow p-6">
      <DynamicForm
        :schema="retirementAccountsSchema"
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
import { retirementAccountsSchema } from '@/schemas/retirementAccounts.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const accounts = ref<Record<string, any>[]>([])
const { markClean, initialize } = useUnsavedChanges(accounts)

function loadFormData() {
  if (store.data?.retirementAccounts) {
    accounts.value = [...(store.data.retirementAccounts as Record<string, any>[])]
  } else {
    accounts.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.retirementAccounts, loadFormData, { deep: true })
})

function removeAccount(index: number) {
  accounts.value.splice(index, 1)
}

async function save() {
  try {
    await store.updateData({ retirementAccounts: accounts.value })
    showToast('Investment/Retirement accounts saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

