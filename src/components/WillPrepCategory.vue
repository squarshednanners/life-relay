<template>
  <div class="border rounded-lg overflow-hidden" :class="borderClass">
    <button
      class="w-full flex items-center justify-between p-4 text-left transition-colors"
      :class="headerClass"
      @click="expanded = !expanded"
    >
      <div class="flex items-center gap-3">
        <span class="text-xs font-semibold uppercase px-2 py-0.5 rounded" :class="badgeClass">
          {{ category.priority }}
        </span>
        <h3 class="font-semibold text-gray-900">{{ category.title }}</h3>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500">
          {{ completedCount }}/{{ category.sections.length }} complete
        </span>
        <svg
          class="w-5 h-5 text-gray-400 transition-transform"
          :class="{ 'rotate-180': expanded }"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </button>

    <div v-if="expanded" class="border-t p-4 space-y-4" :class="contentBorderClass">
      <p class="text-sm text-gray-600 leading-relaxed">{{ category.description }}</p>

      <div class="space-y-2">
        <div
          v-for="section in category.sections"
          :key="section.path"
          class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100"
        >
          <div class="flex items-center gap-2">
            <svg
              v-if="isSectionDone(section.path)"
              class="w-5 h-5 text-green-500"
              fill="currentColor" viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <svg
              v-else
              class="w-5 h-5 text-gray-300"
              fill="currentColor" viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm font-medium text-gray-700">{{ section.label }}</span>
          </div>
          <router-link
            v-if="!isSectionDone(section.path)"
            :to="section.path"
            class="text-xs font-medium text-primary-600 hover:text-primary-800 px-3 py-1 rounded-md hover:bg-primary-50 transition-colors"
          >
            Go &rarr;
          </router-link>
          <span v-else class="text-xs text-green-600 font-medium">Done</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EstatePrepCategory } from '@/data/willPrepCategories'
import { hasSectionData } from '@/composables/useSectionProgress'
import { useLegacyStore } from '@/store'

const props = defineProps<{
  category: EstatePrepCategory
  startExpanded?: boolean
}>()

const store = useLegacyStore()
const expanded = ref(props.startExpanded ?? false)

function isSectionDone(path: string): boolean {
  return hasSectionData(store.data, path)
}

const completedCount = computed(() =>
  props.category.sections.filter(s => isSectionDone(s.path)).length
)

const borderClass = computed(() => {
  switch (props.category.priority) {
    case 'essential': return 'border-blue-200'
    case 'recommended': return 'border-amber-200'
    case 'optional': return 'border-gray-200'
  }
})

const headerClass = computed(() => {
  switch (props.category.priority) {
    case 'essential': return 'bg-blue-50 hover:bg-blue-100'
    case 'recommended': return 'bg-amber-50 hover:bg-amber-100'
    case 'optional': return 'bg-gray-50 hover:bg-gray-100'
  }
})

const contentBorderClass = computed(() => {
  switch (props.category.priority) {
    case 'essential': return 'border-blue-200 bg-blue-50/30'
    case 'recommended': return 'border-amber-200 bg-amber-50/30'
    case 'optional': return 'border-gray-200 bg-gray-50/30'
  }
})

const badgeClass = computed(() => {
  switch (props.category.priority) {
    case 'essential': return 'bg-blue-100 text-blue-700'
    case 'recommended': return 'bg-amber-100 text-amber-700'
    case 'optional': return 'bg-gray-100 text-gray-600'
  }
})
</script>
