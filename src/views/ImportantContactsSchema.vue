<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="importantContactsSchema.title"
      :description="importantContactsSchema.description"
      :schema="importantContactsSchema"
      :form-data="contacts"
    />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <DynamicForm
        :schema="importantContactsSchema"
        :model-value="contacts"
        @update:model-value="contacts = $event"
        @remove="removeContact"
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
import { importantContactsSchema } from '@/schemas/importantContacts.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const contacts = ref<Record<string, any>[]>([])
const { markClean, initialize } = useUnsavedChanges(contacts)

function loadFormData() {
  if (store.data?.importantContacts) {
    contacts.value = [...(store.data.importantContacts as Record<string, any>[])]
  } else {
    contacts.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.importantContacts, loadFormData, { deep: true })
})

function removeContact(index: number) {
  contacts.value.splice(index, 1)
}

async function save() {
  try {
    await store.updateData({ importantContacts: contacts.value })
    showToast('Important contacts saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

