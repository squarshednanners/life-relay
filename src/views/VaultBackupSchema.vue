<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="vaultBackupSchema.title"
      :description="vaultBackupSchema.description"
      :schema="vaultBackupSchema"
      :form-data="vaultBackup"
    />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-800">
        <strong>Why this matters:</strong> If you've exported an encrypted backup of your Life Relay vault,
        your loved ones will need to know where the file is and how to decrypt it. This information will
        be included in your PDF export.
      </div>

      <DynamicForm
        :schema="vaultBackupSchema"
        :model-value="vaultBackup"
        @update:model-value="vaultBackup = $event"
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
import { vaultBackupSchema } from '@/schemas/vaultBackup.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const vaultBackup = ref<Record<string, any>>({})
const { markClean, initialize } = useUnsavedChanges(vaultBackup)

function loadFormData() {
  if (store.data?.vaultBackup) {
    vaultBackup.value = { ...store.data.vaultBackup }
  } else {
    vaultBackup.value = { isEncrypted: true }
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.vaultBackup, loadFormData, { deep: true })
})

async function save() {
  try {
    await store.updateData({ vaultBackup: vaultBackup.value })
    showToast('Life Relay backup info saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>
