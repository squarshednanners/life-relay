<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="$emit('cancel')"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col"
      >
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Emergency One-Page Sheet
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Select which items to include on your emergency sheet.
          </p>
        </div>

        <div class="overflow-y-auto flex-1 p-6 space-y-5">
          <!-- Schema-driven section list. Adding a new schema with
               pdfViews.emergencySheet metadata automatically appears here,
               provided its sectionKey is mapped in SECTION_SELECTION_CONFIG. -->
          <section
            v-for="section in renderableSections"
            :key="section.sectionKey"
          >
            <!-- Multi-item section (array): SectionToggle with per-item checkboxes -->
            <template v-if="getSectionMode(section.sectionKey) !== 'boolean'">
              <SectionToggle
                :label="getPickerLabel(section)"
                :count="getSectionSelectedCount(section.sectionKey)"
                :total="section.items.length"
                @toggle-all="toggleAllItems(section)"
              >
                <div
                  v-for="(item, idx) in section.items"
                  :key="getItemKey(section.sectionKey, item, idx)"
                  class="flex items-center gap-2 py-1"
                >
                  <input
                    v-model="sectionSelections[section.sectionKey]"
                    type="checkbox"
                    :value="getItemSelectionValue(section.sectionKey, item, idx)"
                    class="rounded text-primary-600"
                  >
                  <span class="text-sm text-gray-700 dark:text-gray-300">
                    {{ getItemDisplayLabel(section, item, idx) }}
                  </span>
                </div>
              </SectionToggle>
            </template>

            <!-- Singleton section: single boolean toggle -->
            <template v-else>
              <div class="flex items-center gap-2 py-1">
                <input
                  v-model="booleanSelections[section.sectionKey]"
                  type="checkbox"
                  class="rounded text-primary-600"
                >
                <span
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {{ getPickerLabel(section) }}
                </span>
                <span
                  v-if="section.sectionKey === 'healthInsurance'"
                  class="text-xs text-gray-400 dark:text-gray-500"
                >
                  {{ healthInsuranceSummary }}
                </span>
              </div>
            </template>
          </section>

          <!-- Empty state -->
          <div
            v-if="renderableSections.length === 0"
            class="text-center py-8 text-gray-400 dark:text-gray-500"
          >
            No data available. Add information to your vault first.
          </div>
        </div>

        <div
          class="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center"
        >
          <span class="text-xs text-gray-400 dark:text-gray-500">
            {{ totalSelected }} items selected
          </span>
          <div class="flex gap-3">
            <button
              type="button"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              @click="$emit('cancel')"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="totalSelected === 0"
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              @click="handleGenerate"
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
import { computed, watch, reactive } from 'vue'
import type { DeathboxData } from '@/models/DeathboxData'
import {
  collectFieldsByPdfView,
  type CollectedSection,
  type CollectedItem,
} from '@/pdf/schemaPdfViews'
import { schemaRegistry } from '@/schemas'
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

/**
 * Selection-mode mapping per section. The picker UI is schema-driven (the
 * sections, labels, and item labels come from `pdfViews.emergencySheet`
 * metadata), but the *selection rules* per section are inherently a contract
 * with the bespoke EmergencySheetSelections shape consumed by the PDF
 * generator. Adding a new schema-tagged section requires:
 *   1. Tag it in the schema with `pdfViews.emergencySheet`
 *   2. Add an entry here mapping its sectionKey to a selection mode
 *   3. Add a slot to EmergencySheetSelections + applySelections() in the PDF
 * Until v1.5+ harmonizes the selection model, this duplication is bounded
 * and explicit at the picker/PDF boundary.
 */
type SectionMode = 'ids' | 'indices' | 'boolean'

const SECTION_SELECTION_CONFIG: Record<
  string,
  {
    mode: SectionMode
    /** Key into EmergencySheetSelections to emit. */
    selectionsKey: keyof EmergencySheetSelections
  }
> = {
  people: { mode: 'ids', selectionsKey: 'people' },
  importantContacts: { mode: 'indices', selectionsKey: 'contacts' },
  healthInsurance: { mode: 'boolean', selectionsKey: 'includeHealthInsurance' },
  medicalInfo: { mode: 'indices', selectionsKey: 'medical' },
  physicalStorageLocations: { mode: 'ids', selectionsKey: 'storage' },
  cryptoAssets: { mode: 'indices', selectionsKey: 'crypto' },
  legalDocuments: { mode: 'boolean', selectionsKey: 'includeLegalDocuments' },
}

// --------------------------------------------------------------------------
// Schema-driven section discovery
// --------------------------------------------------------------------------
const collectedSections = computed<CollectedSection[]>(() => {
  if (!props.data) return []
  return collectFieldsByPdfView('emergencySheet', props.data)
})

/**
 * Renderable sections: from the collected sections, drop ones whose section
 * key is not mapped in SECTION_SELECTION_CONFIG (sections we don't yet know
 * how to select for) and drop empty array sections.
 */
const renderableSections = computed<CollectedSection[]>(() => {
  return collectedSections.value.filter((section) => {
    if (!SECTION_SELECTION_CONFIG[section.sectionKey]) return false
    return section.items.length > 0
  })
})

function getSectionMode(sectionKey: string): SectionMode {
  return SECTION_SELECTION_CONFIG[sectionKey]?.mode ?? 'indices'
}

function getPickerLabel(section: CollectedSection): string {
  // Prefer schema's view-scoped pickerLabel; fall back to title (sectionLabel
  // is for the print rendering and may be ALL-CAPS).
  const schema = props.data
    ? collectedSections.value.find((s) => s.sectionKey === section.sectionKey)
    : null
  if (!schema) return section.sectionLabel
  // sectionLabel is the print-side label; for the picker we want the friendly
  // mixed-case label. The CollectedSection only carries `sectionLabel` from
  // the helper, so we re-resolve from the schema registry directly.
  return resolveSchemaPickerLabel(section.sectionKey) ?? section.sectionLabel
}

// --------------------------------------------------------------------------
// Per-section selection state
// --------------------------------------------------------------------------
//
// `sectionSelections` holds either string[] (ids mode) or number[] (indices
// mode) per section key.
// `booleanSelections` holds toggle state for boolean-mode sections.
const sectionSelections = reactive<Record<string, Array<string | number>>>({})
const booleanSelections = reactive<Record<string, boolean>>({})

function getItemSelectionValue(
  sectionKey: string,
  item: CollectedItem,
  index: number,
): string | number {
  const mode = getSectionMode(sectionKey)
  if (mode === 'ids') return String(item.itemId ?? '')
  return index
}

function getItemKey(
  sectionKey: string,
  item: CollectedItem,
  index: number,
): string {
  const mode = getSectionMode(sectionKey)
  if (mode === 'ids' && item.itemId) return `${sectionKey}:${item.itemId}`
  return `${sectionKey}:${index}`
}

function getItemDisplayLabel(
  section: CollectedSection,
  item: CollectedItem,
  idx: number,
): string {
  // Prefer the schema-tagged itemLabel (computed by collectFieldsByPdfView).
  if (item.itemLabel && item.itemLabel.trim() !== '') return item.itemLabel
  // Fallback: schema's arrayItemLabel was already applied; if it returned
  // empty, use a generic placeholder.
  return `${getPickerLabel(section).replace(/s$/, '')} ${idx + 1}`
}

function getSectionSelectedCount(sectionKey: string): number {
  return sectionSelections[sectionKey]?.length ?? 0
}

function toggleAllItems(section: CollectedSection) {
  const current = sectionSelections[section.sectionKey] ?? []
  if (current.length === section.items.length) {
    sectionSelections[section.sectionKey] = []
    return
  }
  const allValues = section.items.map((item, idx) =>
    getItemSelectionValue(section.sectionKey, item, idx),
  )
  sectionSelections[section.sectionKey] = allValues
}

// --------------------------------------------------------------------------
// Health-insurance summary (informational decoration)
// --------------------------------------------------------------------------
const healthInsuranceSummary = computed(() => {
  const hi = props.data?.healthInsurance
  if (Array.isArray(hi)) {
    return (
      hi
        .map((p: { provider?: string }) => p.provider)
        .filter(Boolean)
        .join(', ') || ''
    )
  }
  return ((hi as { provider?: string } | undefined)?.provider ?? '') || ''
})

// --------------------------------------------------------------------------
// Total selected count (across all sections)
// --------------------------------------------------------------------------
const totalSelected = computed(() => {
  let count = 0
  for (const section of renderableSections.value) {
    const mode = getSectionMode(section.sectionKey)
    if (mode === 'boolean') {
      if (booleanSelections[section.sectionKey]) count += 1
    } else {
      count += sectionSelections[section.sectionKey]?.length ?? 0
    }
  }
  return count
})

// --------------------------------------------------------------------------
// Default-select-all-on-open (preserves existing UX)
// --------------------------------------------------------------------------
watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) return
    for (const section of renderableSections.value) {
      const mode = getSectionMode(section.sectionKey)
      if (mode === 'boolean') {
        booleanSelections[section.sectionKey] = true
      } else {
        const allValues = section.items.map((item, idx) =>
          getItemSelectionValue(section.sectionKey, item, idx),
        )
        sectionSelections[section.sectionKey] = allValues
      }
    }
  },
)

// --------------------------------------------------------------------------
// Emit in legacy EmergencySheetSelections shape
// --------------------------------------------------------------------------
function handleGenerate() {
  // Build selections from per-section state. Sections not mapped here default
  // to empty / false — they won't appear in the PDF.
  const selections: EmergencySheetSelections = {
    people: [],
    contacts: [],
    includeHealthInsurance: false,
    medical: [],
    storage: [],
    crypto: [],
    includeLegalDocuments: false,
  }

  // Build via untyped record then cast on emit (TS index-signature gymnastics).
  const out: Record<string, boolean | string[] | number[]> = {
    ...selections,
  } as unknown as Record<string, boolean | string[] | number[]>
  for (const sectionKey of Object.keys(SECTION_SELECTION_CONFIG)) {
    const cfg = SECTION_SELECTION_CONFIG[sectionKey]
    if (!cfg) continue
    if (cfg.mode === 'boolean') {
      out[cfg.selectionsKey] = booleanSelections[sectionKey] ?? false
    } else if (cfg.mode === 'ids') {
      out[cfg.selectionsKey] = (sectionSelections[sectionKey] ?? []).map((v) =>
        String(v),
      )
    } else if (cfg.mode === 'indices') {
      out[cfg.selectionsKey] = (sectionSelections[sectionKey] ?? []).map((v) =>
        Number(v),
      )
    }
  }

  emit('generate', out as unknown as EmergencySheetSelections)
}

function resolveSchemaPickerLabel(sectionKey: string): string | undefined {
  const schema = schemaRegistry[sectionKey]
  if (!schema) return undefined
  const viewMeta = schema.pdfViews?.emergencySheet
  return viewMeta?.pickerLabel ?? schema.title
}
</script>
