<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="$emit('cancel')"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Emergency One-Page Sheet</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Select which items to include on your emergency sheet.</p>
        </div>

        <div class="overflow-y-auto flex-1 p-6 space-y-5">
          <!-- People -->
          <section v-if="people.length > 0">
            <SectionToggle label="Personal Information" :count="selectedPeople.length" :total="people.length" @toggle-all="togglePeople">
              <div v-for="person in people" :key="person.id" class="flex items-center gap-2 py-1">
                <input type="checkbox" :value="person.id" v-model="selectedPeople" class="rounded text-primary-600" />
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ person.name || 'Unnamed' }}</span>
              </div>
            </SectionToggle>
          </section>

          <!-- Important Contacts -->
          <section v-if="contacts.length > 0">
            <SectionToggle label="Key Contacts" :count="selectedContacts.length" :total="contacts.length" @toggle-all="toggleContacts">
              <div v-for="(contact, idx) in contacts" :key="idx" class="flex items-center gap-2 py-1">
                <input type="checkbox" :value="idx" v-model="selectedContacts" class="rounded text-primary-600" />
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ [contact.name, contact.role].filter(Boolean).join(' - ') || 'Unnamed' }}</span>
              </div>
            </SectionToggle>
          </section>

          <!-- Health Insurance -->
          <section v-if="hasHealthInsurance">
            <div class="flex items-center gap-2 py-1">
              <input type="checkbox" v-model="includeHealthInsurance" class="rounded text-primary-600" />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Health Insurance</span>
              <span class="text-xs text-gray-400 dark:text-gray-500">{{ healthInsuranceSummary }}</span>
            </div>
          </section>

          <!-- Medical Info -->
          <section v-if="medicalInfoItems.length > 0">
            <SectionToggle label="Medical Information" :count="selectedMedical.length" :total="medicalInfoItems.length" @toggle-all="toggleMedical">
              <div v-for="(med, idx) in medicalInfoItems" :key="idx" class="flex items-center gap-2 py-1">
                <input type="checkbox" :value="idx" v-model="selectedMedical" class="rounded text-primary-600" />
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ getPersonName(med.personId) || `Medical Record ${idx + 1}` }}</span>
              </div>
            </SectionToggle>
          </section>

          <!-- Physical Storage -->
          <section v-if="storageLocations.length > 0">
            <SectionToggle label="Key Document Locations" :count="selectedStorage.length" :total="storageLocations.length" @toggle-all="toggleStorage">
              <div v-for="loc in storageLocations" :key="loc.id" class="flex items-center gap-2 py-1">
                <input type="checkbox" :value="loc.id" v-model="selectedStorage" class="rounded text-primary-600" />
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ [loc.name, loc.locationType].filter(Boolean).join(' - ') || 'Unnamed' }}</span>
              </div>
            </SectionToggle>
          </section>

          <!-- Crypto Assets -->
          <section v-if="cryptoAssets.length > 0">
            <SectionToggle label="Cryptocurrency Assets" :count="selectedCrypto.length" :total="cryptoAssets.length" @toggle-all="toggleCrypto">
              <div v-for="(asset, idx) in cryptoAssets" :key="idx" class="flex items-center gap-2 py-1">
                <input type="checkbox" :value="idx" v-model="selectedCrypto" class="rounded text-primary-600" />
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ cryptoAssetLabel(asset) }}</span>
              </div>
            </SectionToggle>
          </section>

          <!-- Legal Documents -->
          <section v-if="hasLegalDocuments">
            <div class="flex items-center gap-2 py-1">
              <input type="checkbox" v-model="includeLegalDocuments" class="rounded text-primary-600" />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Legal Documents</span>
            </div>
          </section>

          <!-- Empty state -->
          <div v-if="!hasAnything" class="text-center py-8 text-gray-400 dark:text-gray-500">
            No data available. Add information to your vault first.
          </div>
        </div>

        <div class="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <span class="text-xs text-gray-400 dark:text-gray-500">
            {{ totalSelected }} items selected
          </span>
          <div class="flex gap-3">
            <button
              type="button"
              @click="$emit('cancel')"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="handleGenerate"
              :disabled="totalSelected === 0"
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Generate Sheet
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { DeathboxData } from '@/models/DeathboxData'
import SectionToggle from './EmergencySheetSectionToggle.vue'

export interface EmergencySheetSelections {
  people: string[]
  contacts: number[]
  includeHealthInsurance: boolean
  medical: number[]
  storage: string[]
  crypto: number[]
  includeLegalDocuments: boolean
}

const props = defineProps<{
  isOpen: boolean
  data: DeathboxData | null
}>()

const emit = defineEmits<{
  cancel: []
  generate: [selections: EmergencySheetSelections]
}>()

const selectedPeople = ref<string[]>([])
const selectedContacts = ref<number[]>([])
const includeHealthInsurance = ref(true)
const selectedMedical = ref<number[]>([])
const selectedStorage = ref<string[]>([])
const selectedCrypto = ref<number[]>([])
const includeLegalDocuments = ref(true)

const people = computed(() => props.data?.people ?? [])
const contacts = computed(() => props.data?.importantContacts ?? [])
const medicalInfoItems = computed(() => props.data?.medicalInfo ?? [])
const storageLocations = computed(() => props.data?.physicalStorageLocations ?? [])
const cryptoAssets = computed(() => props.data?.cryptoAssets ?? [])

const hasHealthInsurance = computed(() => {
  const hi = props.data?.healthInsurance as any
  if (Array.isArray(hi)) return hi.length > 0
  return !!(hi && (hi.provider || hi.policyNumber))
})

const healthInsuranceSummary = computed(() => {
  const hi = props.data?.healthInsurance
  if (Array.isArray(hi)) return hi.map((p: any) => p.provider).filter(Boolean).join(', ') || ''
  return (hi as any)?.provider || ''
})

const hasLegalDocuments = computed(() => {
  const ld = props.data?.legalDocuments
  return !!(ld && (ld.willLocation || ld.powerOfAttorney || ld.livingWill || ld.poaAgent))
})

const hasAnything = computed(() =>
  people.value.length > 0 ||
  contacts.value.length > 0 ||
  hasHealthInsurance.value ||
  medicalInfoItems.value.length > 0 ||
  storageLocations.value.length > 0 ||
  cryptoAssets.value.length > 0 ||
  hasLegalDocuments.value
)

const totalSelected = computed(() =>
  selectedPeople.value.length +
  selectedContacts.value.length +
  (includeHealthInsurance.value && hasHealthInsurance.value ? 1 : 0) +
  selectedMedical.value.length +
  selectedStorage.value.length +
  selectedCrypto.value.length +
  (includeLegalDocuments.value && hasLegalDocuments.value ? 1 : 0)
)

function getPersonName(personId?: string): string {
  if (!personId) return ''
  const person = people.value.find(p => p.id === personId)
  return person?.name || ''
}

function togglePeople() {
  selectedPeople.value = selectedPeople.value.length === people.value.length
    ? [] : people.value.map(p => p.id)
}

function toggleContacts() {
  selectedContacts.value = selectedContacts.value.length === contacts.value.length
    ? [] : contacts.value.map((_, i) => i)
}

function toggleMedical() {
  selectedMedical.value = selectedMedical.value.length === medicalInfoItems.value.length
    ? [] : medicalInfoItems.value.map((_, i) => i)
}

function toggleStorage() {
  selectedStorage.value = selectedStorage.value.length === storageLocations.value.length
    ? [] : storageLocations.value.map(s => s.id)
}

function toggleCrypto() {
  selectedCrypto.value = selectedCrypto.value.length === cryptoAssets.value.length
    ? [] : cryptoAssets.value.map((_, i) => i)
}

function cryptoAssetLabel(asset: any): string {
  return asset.nickname || asset.type || [asset.blockchain, asset.storageType].filter(Boolean).join(' - ') || 'Unnamed Asset'
}

// Select all by default when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    selectedPeople.value = people.value.map(p => p.id)
    selectedContacts.value = contacts.value.map((_, i) => i)
    includeHealthInsurance.value = true
    selectedMedical.value = medicalInfoItems.value.map((_, i) => i)
    selectedStorage.value = storageLocations.value.map(s => s.id)
    selectedCrypto.value = cryptoAssets.value.map((_, i) => i)
    includeLegalDocuments.value = true
  }
})

function handleGenerate() {
  emit('generate', {
    people: selectedPeople.value,
    contacts: selectedContacts.value,
    includeHealthInsurance: includeHealthInsurance.value,
    medical: selectedMedical.value,
    storage: selectedStorage.value,
    crypto: selectedCrypto.value,
    includeLegalDocuments: includeLegalDocuments.value,
  })
}
</script>
