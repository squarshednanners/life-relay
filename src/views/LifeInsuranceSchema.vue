<template>
  <div class="max-w-3xl">
    <SectionHeader
      :title="lifeInsurancePolicySchema.title"
      :description="'Life insurance policies and beneficiaries'"
      :schema="lifeInsurancePolicySchema"
      :form-data="policies"
    />

    <div class="bg-white rounded-lg shadow p-6">
      <DynamicForm
        :schema="lifeInsurancePolicySchema"
        :model-value="policies"
        @update:model-value="policies = $event"
        @remove="removePolicy"
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
import { lifeInsurancePolicySchema } from '@/schemas/lifeInsurance.schema'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

const store = useLegacyStore()
const { showToast } = useToast()
const policies = ref<Record<string, any>[]>([])
const { markClean, initialize } = useUnsavedChanges(policies)

function loadFormData() {
  if (store.data?.lifeInsurance?.policies) {
    policies.value = [...(store.data.lifeInsurance.policies as Record<string, any>[])]
  } else {
    policies.value = []
  }
}

onMounted(() => {
  loadFormData()
  initialize()
  watch(() => store.data?.lifeInsurance?.policies, loadFormData, { deep: true })
})

function removePolicy(index: number) {
  policies.value.splice(index, 1)
}

async function save() {
  try {
    await store.updateData({
      lifeInsurance: {
        policies: policies.value,
      },
    })
    showToast('Life insurance information saved!', 'success')
    markClean()
  } catch (error) {
    console.error('Error saving:', error)
    showToast('Error saving data. Please try again.', 'error')
  }
}
</script>

