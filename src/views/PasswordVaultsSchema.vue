<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="passwordVaultsSchema.title"
      :description="passwordVaultsSchema.description"
      :schema="passwordVaultsSchema"
      :form-data="vaults"
    />

    <div class="bg-white rounded-lg shadow p-6">
      <DynamicForm
        :schema="passwordVaultsSchema"
        :model-value="vaults"
        @update:model-value="vaults = $event"
        @remove="removeVault"
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
import { passwordVaultsSchema } from '@/schemas/passwordVaults.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
// Data structure is defined by the schema, not a static TypeScript interface
const vaults = ref<Record<string, any>[]>([])
const { markClean, initialize } = useUnsavedChanges(vaults)

function loadFormData() {
  if (store.data?.passwordVaults) {
    vaults.value = [...(store.data.passwordVaults as Record<string, any>[])]
  } else {
    vaults.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.passwordVaults, loadFormData, { deep: true })
})

function removeVault(index: number) {
  vaults.value.splice(index, 1)
}

async function save() {
  try {
    await store.updateData({ passwordVaults: vaults.value })
    showToast('Password vaults saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

