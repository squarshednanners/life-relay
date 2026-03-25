<template>
  <div class="max-w-3xl">
    <SectionHeader
      title="Notes"
      description="Additional notes, thoughts, or information"
    />

    <div class="bg-white rounded-lg shadow p-6">
      <form @submit.prevent="save">
        <FormField
          id="notes"
          label="Notes"
          type="textarea"
          v-model="notes"
          :rows="15"
          placeholder="Any additional notes, thoughts, or information you'd like to include..."
        />

        <div class="mt-6 flex gap-4">
          <button
            type="submit"
            class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useLegacyStore } from '@/store'
import { useToast } from '@/composables/useToast'
import FormField from '@/components/FormField.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const notes = ref('')
const { markClean, initialize } = useUnsavedChanges(notes)

function loadFormData() {
  notes.value = store.data?.notes || ''
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.notes, loadFormData)
})

async function save() {
  try {
    await store.updateData({ notes: notes.value })
    showToast('Notes saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

