<template>
  <div class="space-y-2">
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    
    <div v-for="(assignment, index) in assignments" :key="index" class="flex gap-2 items-end">
      <div class="flex-1">
        <label class="block text-xs text-gray-600 mb-1">Beneficiary</label>
        <select
          v-model="assignment.beneficiaryId"
          @change="onChange"
          class="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Select Beneficiary or Enter Custom</option>
          <option
            v-for="beneficiary in availableBeneficiaries"
            :key="beneficiary.id"
            :value="beneficiary.id"
          >
            {{ beneficiary.name || 'Unnamed' }}
            ({{ beneficiary.type === 'primary' ? 'Primary' : 'Secondary' }})
            <span v-if="beneficiary.percentage"> - {{ beneficiary.percentage }}%</span>
          </option>
        </select>
      </div>
      <div class="flex-1" v-if="!assignment.beneficiaryId">
        <label class="block text-xs text-gray-600 mb-1">Custom Name</label>
        <input
          v-model="assignment.customName"
          @input="onChange"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Custom Beneficiary Name"
        />
      </div>
      <div class="w-32">
        <label class="block text-xs text-gray-600 mb-1">Percentage (%)</label>
        <input
          v-model.number="assignment.percentage"
          @input="onChange"
          type="number"
          min="0"
          max="100"
          step="0.01"
          class="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="%"
        />
      </div>
      <button
        v-if="allowMultiple && assignments.length > 1"
        @click="removeAssignment(index)"
        class="px-3 py-2 text-red-600 hover:text-red-800"
        type="button"
      >
        Remove
      </button>
    </div>
    
    <button
      v-if="allowMultiple"
      @click="addAssignment"
      type="button"
      class="text-sm text-primary-600 hover:text-primary-800"
    >
      + Add Another Beneficiary
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useLegacyStore } from '@/store'
import type { BeneficiaryAssignment } from '@/models/DeathboxData'

const props = defineProps<{
  modelValue?: BeneficiaryAssignment[]
  label?: string
  required?: boolean
  allowMultiple?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: BeneficiaryAssignment[]]
}>()

const store = useLegacyStore()
const assignments = ref<BeneficiaryAssignment[]>([])

const availableBeneficiaries = computed(() => {
  return (store.data?.beneficiaries as any[]) || []
})

function loadAssignments() {
  if (props.modelValue && props.modelValue.length > 0) {
    assignments.value = props.modelValue.map((a) => ({ ...a }))
  } else {
    assignments.value = [{ beneficiaryId: '', customName: '', percentage: 0 }]
    // Initialize the parent if it's empty
    if (!props.modelValue || props.modelValue.length === 0) {
      onChange()
    }
  }
}

onMounted(() => {
  loadAssignments()
})

watch(() => props.modelValue, loadAssignments, { deep: true })

function addAssignment() {
  assignments.value.push({ beneficiaryId: '', customName: '', percentage: 0 })
  onChange()
}

function removeAssignment(index: number) {
  assignments.value.splice(index, 1)
  onChange()
}

function onChange() {
  emit('update:modelValue', assignments.value)
}
</script>

