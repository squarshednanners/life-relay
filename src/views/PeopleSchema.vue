<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="peopleSchema.title"
      :description="peopleSchema.description"
      :schema="peopleSchema"
      :form-data="people"
    />

    <div class="bg-white rounded-lg shadow p-6">
      <DynamicForm
        :schema="peopleSchema"
        :model-value="people"
        @update:model-value="people = $event"
        @remove="removePerson"
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
import { peopleSchema } from '@/schemas/people.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const people = ref<Record<string, any>[]>([])
const { markClean, initialize } = useUnsavedChanges(people)

function loadFormData() {
  if (store.data?.people) {
    people.value = [...(store.data.people as Record<string, any>[])]
  } else {
    people.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.people, loadFormData, { deep: true })
})

function removePerson(index: number) {
  const person = people.value[index]
  if (confirm(`Remove ${person.name || 'this person'}? This will also remove their medical and burial information.`)) {
    // Remove associated medical info and burial preferences
    if (store.data) {
      const updatedMedicalInfo = store.data.medicalInfo?.filter((m: any) => m.personId !== person.id) || []
      const updatedBurialPreferences = store.data.burialPreferences?.filter((b: any) => b.personId !== person.id) || []
      store.updateData({
        medicalInfo: updatedMedicalInfo,
        burialPreferences: updatedBurialPreferences,
      })
    }
    people.value.splice(index, 1)
  }
}

// Ensure all people have IDs (backup in case schema initialization doesn't work)
watch(people, (newPeople) => {
  newPeople.forEach((person: any) => {
    if (!person.id) {
      person.id = `person-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
  })
}, { deep: true })

async function save() {
  try {
    await store.updateData({ people: people.value as any })
    showToast('People information saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

