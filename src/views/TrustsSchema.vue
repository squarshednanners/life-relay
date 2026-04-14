<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="trustsSchema.title"
      :description="trustsSchema.description"
      :schema="trustsSchema"
      :form-data="trusts"
    />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <DynamicForm
        :schema="trustsSchema"
        :model-value="trusts"
        @update:model-value="trusts = $event"
        @remove="removeTrust"
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
import { trustsSchema } from '@/schemas/trusts.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const trusts = ref<Record<string, any>[]>([])
const { markClean, initialize } = useUnsavedChanges(trusts)

function loadFormData() {
  if (store.data?.trusts) {
    trusts.value = [...(store.data.trusts as Record<string, any>[])]
  } else {
    trusts.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.trusts, loadFormData, { deep: true })
})

function removeTrust(index: number) {
  trusts.value.splice(index, 1)
}

async function save() {
  try {
    await store.updateData({ trusts: trusts.value as any })
    showToast('Trusts saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

