<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-gray-700">Trust {{ role === 'owner' ? 'Owner' : 'Beneficiaries' }}</label>
    <div v-if="assignments.length > 0" class="space-y-2 mb-2">
      <div
        v-for="(assignment, index) in assignments"
        :key="index"
        class="flex items-center gap-2 p-2 bg-gray-50 rounded"
      >
        <span class="flex-1">
          <span v-if="assignment.trustId">
            {{ getTrustName(assignment.trustId) }}
          </span>
          <span v-else-if="assignment.customName">
            {{ assignment.customName }}
          </span>
          <span v-else>Unnamed</span>
          <span v-if="assignment.percentage" class="text-gray-600 ml-2">
            ({{ assignment.percentage }}%)
          </span>
          <span v-if="assignment.role" class="text-gray-600 ml-2 text-xs">
            [{{ assignment.role === 'owner' ? 'Owner' : 'Beneficiary' }}]
          </span>
        </span>
        <button
          @click="removeAssignment(index)"
          class="text-red-600 hover:text-red-800 text-sm"
        >
          Remove
        </button>
      </div>
    </div>
    <div class="flex gap-2">
      <select
        v-model="selectedTrustId"
        class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
      >
        <option value="">Select trust</option>
        <option
          v-for="trust in availableTrusts"
          :key="trust.id"
          :value="trust.id"
        >
          {{ trust.trustName || 'Unnamed Trust' }}
        </option>
      </select>
      <input
        v-model="customTrustName"
        type="text"
        placeholder="Or enter custom name"
        class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
      />
      <input
        v-model.number="percentage"
        type="number"
        min="0"
        max="100"
        placeholder="%"
        class="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm"
      />
      <button
        @click="addAssignment"
        :disabled="!selectedTrustId && !customTrustName"
        class="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Add
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLegacyStore } from '@/store'
import type { TrustAssignment } from '@/models/DeathboxData'

const props = defineProps<{
  modelValue: TrustAssignment[]
  role?: 'owner' | 'beneficiary' // Default role for new assignments
}>()

const emit = defineEmits<{
  'update:modelValue': [value: TrustAssignment[]]
}>()

const store = useLegacyStore()
const selectedTrustId = ref<string>('')
const customTrustName = ref<string>('')
const percentage = ref<number | undefined>(undefined)

const availableTrusts = computed(() => {
  return (store.data?.trusts as any[]) || []
})

const assignments = computed({
  get: () => props.modelValue || [],
  set: (value) => emit('update:modelValue', value),
})

function getTrustName(trustId: string): string {
  const trust = store.data?.trusts?.find(t => t.id === trustId)
  return trust?.trustName || 'Unknown Trust'
}

function addAssignment() {
  if (!selectedTrustId.value && !customTrustName.value) return

  const newAssignment: TrustAssignment = {
    percentage: percentage.value,
    role: props.role || 'beneficiary',
  }

  if (selectedTrustId.value) {
    newAssignment.trustId = selectedTrustId.value
  } else {
    newAssignment.customName = customTrustName.value
  }

  assignments.value = [...assignments.value, newAssignment]

  // Reset form
  selectedTrustId.value = ''
  customTrustName.value = ''
  percentage.value = undefined
}

function removeAssignment(index: number) {
  const newAssignments = [...assignments.value]
  newAssignments.splice(index, 1)
  assignments.value = newAssignments
}
</script>

