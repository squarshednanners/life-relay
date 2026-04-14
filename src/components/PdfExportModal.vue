<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="$emit('cancel')"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Export PDF</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Select which sections to include in the PDF.</p>
        </div>

        <div class="overflow-y-auto flex-1 p-6 space-y-5">
          <div v-for="group in groups" :key="group.name">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ group.name }}</span>
              <button
                type="button"
                @click="toggleGroup(group)"
                class="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
              >
                {{ isGroupFullySelected(group) ? 'Deselect all' : 'Select all' }}
              </button>
            </div>
            <div class="ml-2 space-y-0.5">
              <div
                v-for="section in group.sections"
                :key="section.sectionKey"
                class="flex items-center gap-2 py-1"
              >
                <input
                  type="checkbox"
                  :value="section.sectionKey"
                  v-model="selected"
                  :disabled="!section.hasData"
                  class="rounded text-primary-600 disabled:opacity-30"
                />
                <span class="text-sm" :class="section.hasData ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'">
                  {{ section.title }}
                </span>
                <span v-if="!section.hasData" class="text-xs text-gray-400 dark:text-gray-500">(empty)</span>
              </div>
            </div>
          </div>
        </div>

        <div class="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <span class="text-xs text-gray-400 dark:text-gray-500">
              {{ selected.length }} of {{ totalSections }} sections
            </span>
            <button
              type="button"
              @click="selectAllWithData"
              class="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
            >
              Select all with data
            </button>
          </div>
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
              :disabled="selected.length === 0"
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              Generate PDF
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
import { schemaRegistry } from '@/schemas/index'

interface SectionEntry {
  sectionKey: string
  title: string
  hasData: boolean
}

interface GroupEntry {
  name: string
  sections: SectionEntry[]
}

const props = defineProps<{
  isOpen: boolean
  data: DeathboxData | null
}>()

const emit = defineEmits<{
  cancel: []
  generate: [sectionKeys: Set<string>]
}>()

const selected = ref<string[]>([])

const GROUP_ORDER = [
  'People & Contacts',
  'Security & Access',
  'Insurance, Medical & Benefits',
  'Finances',
  'Digital & Crypto Assets',
  'Property & Household',
  'Documents & Storage',
  'Final Wishes',
]

function sectionHasData(sectionKey: string): boolean {
  if (!props.data) return false
  if (sectionKey === 'lifeInsurance.policies') {
    return !!(props.data.lifeInsurance?.policies && props.data.lifeInsurance.policies.length > 0)
  }
  const sectionData = (props.data as any)[sectionKey]
  if (!sectionData) return false
  if (Array.isArray(sectionData)) return sectionData.length > 0
  if (typeof sectionData === 'object') {
    return Object.values(sectionData).some((v: any) => {
      if (v === null || v === undefined || v === '') return false
      if (typeof v === 'string' && v.trim() === '') return false
      if (Array.isArray(v) && v.length === 0) return false
      return true
    })
  }
  return true
}

const groups = computed<GroupEntry[]>(() => {
  const grouped: Record<string, SectionEntry[]> = {}

  for (const [key, schema] of Object.entries(schemaRegistry)) {
    const group = schema.pdfGroup || 'Other'
    if (!grouped[group]) grouped[group] = []
    grouped[group].push({
      sectionKey: key,
      title: schema.title,
      hasData: sectionHasData(key),
    })
  }

  // Add notes special case
  if (!grouped['Final Wishes']) grouped['Final Wishes'] = []
  grouped['Final Wishes'].push({
    sectionKey: 'notes',
    title: 'Additional Notes',
    hasData: !!(props.data?.notes && props.data.notes.trim().length > 0),
  })

  return GROUP_ORDER
    .map(name => ({ name, sections: grouped[name] || [] }))
    .filter(g => g.sections.length > 0)
})

const totalSections = computed(() => groups.value.reduce((sum, g) => sum + g.sections.length, 0))

function isGroupFullySelected(group: GroupEntry): boolean {
  const selectable = group.sections.filter(s => s.hasData)
  if (selectable.length === 0) return false
  return selectable.every(s => selected.value.includes(s.sectionKey))
}

function toggleGroup(group: GroupEntry) {
  const selectable = group.sections.filter(s => s.hasData).map(s => s.sectionKey)
  if (isGroupFullySelected(group)) {
    selected.value = selected.value.filter(k => !selectable.includes(k))
  } else {
    const toAdd = selectable.filter(k => !selected.value.includes(k))
    selected.value = [...selected.value, ...toAdd]
  }
}

function selectAllWithData() {
  selected.value = groups.value
    .flatMap(g => g.sections)
    .filter(s => s.hasData)
    .map(s => s.sectionKey)
}

// Select all sections with data when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    selectAllWithData()
  }
})

function handleGenerate() {
  emit('generate', new Set(selected.value))
}
</script>
