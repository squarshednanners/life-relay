<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ImportedRecord } from '@/services/import/ImportSource'
import type { CommitChoice } from '@/services/import/commit'
import { schemaRegistry } from '@/schemas'

interface Props {
  records: ImportedRecord[]
  /** Map<recordIndex, existing record refs> from detectDuplicates. */
  dedupMap: Map<number, unknown[]>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'confirm', records: ImportedRecord[], choices: CommitChoice[]): void
  (e: 'cancel'): void
}>()

// Sentinel target-section values offered in the dropdown beyond the
// schema sections — Skip + dump-to-notes are AC4-required affordances.
const SKIP_VALUE = '__skip'
const NOTES_VALUE = '__notes'

// Per-row local state. Initialized at mount; re-initialized when the
// parent passes a new `records` reference (e.g., user navigates Back to
// the picker and re-imports a different file).
const localRecords = ref<ImportedRecord[]>([])
const checked = ref<boolean[]>([])
const choices = ref<CommitChoice[]>([])
const expandedRow = ref<number | null>(null)

function reinitFromProps() {
  localRecords.value = props.records.map(r => JSON.parse(JSON.stringify(r)))
  checked.value = props.records.map(() => true)
  choices.value = props.records.map(() => ({ choice: 'add' }))
  expandedRow.value = null
}
reinitFromProps()
watch(() => props.records, reinitFromProps)

const sectionOptions = computed(() => {
  return Object.entries(schemaRegistry).map(([key, schema]) => ({
    value: key,
    label: schema.title,
  }))
})

const counts = computed(() => {
  let ready = 0
  let needsAttention = 0
  let willSkip = 0
  localRecords.value.forEach((r, i) => {
    if (!checked.value[i] || choices.value[i].choice === 'skip') {
      willSkip++
      return
    }
    const hasErrors = r.validationIssues.some(issue => issue.severity === 'error')
    if (hasErrors || r.proposedSection === null) {
      needsAttention++
    } else {
      ready++
    }
  })
  return { ready, needsAttention, willSkip }
})

function toggleExpand(index: number) {
  expandedRow.value = expandedRow.value === index ? null : index
}

function updateSection(index: number, sectionKey: string) {
  if (sectionKey === SKIP_VALUE) {
    choices.value[index] = { choice: 'skip' }
    return
  }
  if (sectionKey === NOTES_VALUE) {
    // "Notes (append unmapped)" — drop everything from proposedFields
    // into unmappedFields so the commit step appends the whole row to
    // the target Notes section. The user picks a target section that
    // actually has a notes field; we default to the dedicated `notes`
    // top-level section.
    const r = localRecords.value[index]
    const combined: Record<string, string> = { ...r.unmappedFields }
    for (const [k, v] of Object.entries(r.proposedFields)) {
      combined[k] = String(v ?? '')
    }
    r.proposedSection = 'notes'
    r.proposedFields = {}
    r.unmappedFields = combined
    return
  }
  localRecords.value[index].proposedSection = sectionKey === '' ? null : sectionKey
}

function confirm() {
  const out: ImportedRecord[] = []
  const outChoices: CommitChoice[] = []
  localRecords.value.forEach((r, i) => {
    out.push(r)
    if (!checked.value[i] || r.proposedSection === null) {
      outChoices.push({ choice: 'skip' })
    } else {
      outChoices.push(choices.value[i])
    }
  })
  emit('confirm', out, outChoices)
}

const allChecked = computed(() => checked.value.length > 0 && checked.value.every(v => v))
const anyChecked = computed(() => checked.value.some(v => v))

function selectAll() {
  checked.value = checked.value.map(() => true)
}

function deselectAll() {
  checked.value = checked.value.map(() => false)
}

function compactMappedSummary(record: ImportedRecord): string {
  // Compact one-line summary of mapped fields, capped so the table cell
  // doesn't blow out. Used in the new "Mapped fields preview" column.
  const entries = Object.entries(record.proposedFields)
  if (entries.length === 0) return '—'
  const trimmed = entries.slice(0, 3).map(([k, v]) => `${k}: ${String(v).slice(0, 20)}`)
  const suffix = entries.length > 3 ? ` (+${entries.length - 3} more)` : ''
  return trimmed.join(', ') + suffix
}

function getDedupCandidates(index: number): Array<{ id: string; label: string }> {
  const matches = props.dedupMap.get(index)
  if (!matches) return []
  return matches.map(m => {
    const obj = m as Record<string, unknown>
    const label =
      (obj.name as string | undefined) ??
      (obj.label as string | undefined) ??
      (obj.title as string | undefined) ??
      (obj.institution as string | undefined) ??
      'Existing record'
    return { id: String(obj.id ?? ''), label }
  })
}
</script>

<template>
  <div class="max-w-5xl">
    <p class="text-sm text-text-secondary dark:text-gray-400 mb-4">
      Review the proposed placement for each record. Adjust the target section, fix any
      issues, or uncheck rows you want to leave out.
    </p>

    <div class="rounded-lg border border-border dark:border-gray-700 bg-surface-ivory dark:bg-gray-800 overflow-hidden">
      <table class="min-w-full text-sm">
        <thead class="bg-surface-ivory dark:bg-gray-800 border-b border-border dark:border-gray-700">
          <tr class="text-left text-text-secondary dark:text-gray-400">
            <th class="px-4 py-2 w-10">
              <input
                type="checkbox"
                class="rounded"
                :checked="allChecked"
                :indeterminate.prop="anyChecked && !allChecked"
                :aria-label="allChecked ? 'Deselect all rows' : 'Select all rows'"
                @change="(e) => ((e.target as HTMLInputElement).checked ? selectAll() : deselectAll())"
              >
            </th>
            <th class="px-4 py-2">
              Source
            </th>
            <th class="px-4 py-2">
              Target section
            </th>
            <th class="px-4 py-2">
              Mapped fields
            </th>
            <th class="px-4 py-2">
              Issues
            </th>
            <th class="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          <template
            v-for="(record, index) in localRecords"
            :key="index"
          >
            <tr class="border-b border-border dark:border-gray-700 last:border-0">
              <td class="px-4 py-3">
                <input
                  v-model="checked[index]"
                  type="checkbox"
                  class="rounded"
                  :aria-label="`Include ${record.sourceLabel}`"
                >
              </td>
              <td class="px-4 py-3 text-text-primary dark:text-gray-100">
                {{ record.sourceLabel }}
              </td>
              <td class="px-4 py-3">
                <select
                  :value="record.proposedSection ?? ''"
                  class="rounded-md border border-border dark:border-gray-700 bg-surface-white dark:bg-gray-900 text-text-primary dark:text-gray-100 px-2 py-1 focus-visible:outline-none focus-visible:shadow-focus"
                  @change="(e) => updateSection(index, (e.target as HTMLSelectElement).value)"
                >
                  <option value="">
                    Choose a section
                  </option>
                  <option
                    v-for="opt in sectionOptions"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                  <option :value="NOTES_VALUE">
                    Notes (append unmapped)
                  </option>
                  <option :value="SKIP_VALUE">
                    Skip
                  </option>
                </select>
                <div
                  v-if="getDedupCandidates(index).length > 0"
                  class="mt-2 text-xs text-text-secondary dark:text-gray-400"
                >
                  Looks like an existing entry:
                  <label class="ml-2">
                    <input
                      v-model="choices[index].choice"
                      type="radio"
                      value="add"
                      :name="`choice-${index}`"
                    >
                    add new
                  </label>
                  <label class="ml-2">
                    <input
                      v-model="choices[index].choice"
                      type="radio"
                      value="merge"
                      :name="`choice-${index}`"
                      @change="choices[index].mergeTargetId = getDedupCandidates(index)[0].id"
                    >
                    merge
                  </label>
                </div>
              </td>
              <td class="px-4 py-3 text-xs text-text-secondary dark:text-gray-400">
                {{ compactMappedSummary(record) }}
              </td>
              <td class="px-4 py-3">
                <span
                  v-if="record.validationIssues.length === 0"
                  class="text-text-secondary dark:text-gray-400"
                >
                  —
                </span>
                <span
                  v-else
                  class="px-2 py-0.5 rounded-full text-xs"
                  :class="
                    record.validationIssues.some(i => i.severity === 'error')
                      ? 'bg-accent-700/10 dark:bg-accent-700/20 text-accent-700 dark:text-accent-700'
                      : 'bg-text-secondary/10 dark:bg-gray-700 text-text-secondary dark:text-gray-400'
                  "
                >
                  {{ record.validationIssues.length }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <button
                  type="button"
                  class="text-xs text-accent-700 dark:text-accent-700 hover:underline focus-visible:outline-none focus-visible:shadow-focus"
                  @click="toggleExpand(index)"
                >
                  {{ expandedRow === index ? 'Collapse' : 'Details' }}
                </button>
              </td>
            </tr>
            <tr
              v-if="expandedRow === index"
              class="border-b border-border dark:border-gray-700 bg-surface-ivory dark:bg-gray-800"
            >
              <td
                colspan="6"
                class="px-4 py-3"
              >
                <div class="text-xs text-text-secondary dark:text-gray-400 mb-2">
                  Mapped fields
                </div>
                <pre class="text-xs whitespace-pre-wrap text-text-primary dark:text-gray-100">{{
                  JSON.stringify(record.proposedFields, null, 2)
                }}</pre>
                <div
                  v-if="Object.keys(record.unmappedFields).length > 0"
                  class="mt-3"
                >
                  <div class="text-xs text-text-secondary dark:text-gray-400 mb-2">
                    Unmapped (will append to notes)
                  </div>
                  <pre class="text-xs whitespace-pre-wrap text-text-primary dark:text-gray-100">{{
                    JSON.stringify(record.unmappedFields, null, 2)
                  }}</pre>
                </div>
                <div
                  v-if="record.validationIssues.length > 0"
                  class="mt-3"
                >
                  <div class="text-xs text-text-secondary dark:text-gray-400 mb-2">
                    Issues
                  </div>
                  <ul class="text-xs text-text-primary dark:text-gray-100 space-y-1">
                    <li
                      v-for="(issue, j) in record.validationIssues"
                      :key="j"
                      :class="
                        issue.severity === 'error' ? 'text-accent-700' : 'text-text-secondary'
                      "
                    >
                      {{ issue.message }}
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex items-center justify-between">
      <div class="text-sm text-text-secondary dark:text-gray-400">
        {{ counts.ready }} records ready · {{ counts.needsAttention }} need attention ·
        {{ counts.willSkip }} will be skipped
      </div>
      <div class="flex gap-3">
        <button
          type="button"
          class="px-4 py-2 text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-gray-100 focus-visible:outline-none focus-visible:shadow-focus"
          @click="emit('cancel')"
        >
          Cancel
        </button>
        <button
          type="button"
          class="px-4 py-2 bg-accent-700 text-surface-ivory rounded-md hover:bg-accent-800 disabled:opacity-50 focus-visible:outline-none focus-visible:shadow-focus"
          :disabled="counts.ready === 0"
          @click="confirm"
        >
          Add to vault
        </button>
      </div>
    </div>
  </div>
</template>
