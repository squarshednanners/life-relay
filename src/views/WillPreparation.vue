<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Estate Planning Guide</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Organize your information before meeting with an estate planning attorney — whether you need a will, a trust, or both.
      </p>
    </div>

    <WillPrepDisclaimer />

    <!-- Progress Bar -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Readiness</span>
        <span class="text-sm font-semibold" :class="progressColorClass">
          {{ readiness.completed }}/{{ readiness.total }} sections complete
        </span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
        <div
          class="h-3 rounded-full transition-all duration-500"
          :class="progressBarClass"
          :style="{ width: readiness.percentage + '%' }"
        ></div>
      </div>
      <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
        <template v-if="readiness.percentage < 50">
          Fill in the essential sections below to prepare for your attorney meeting.
        </template>
        <template v-else-if="readiness.percentage < 100">
          Good progress! Complete the remaining sections for a thorough preparation.
        </template>
        <template v-else>
          All sections complete. You're ready to generate your Attorney Preparation Summary.
        </template>
      </p>
    </div>

    <!-- Categories -->
    <div class="space-y-3">
      <WillPrepCategoryCard
        v-for="category in estatePrepCategories"
        :key="category.id"
        :category="category"
        :start-expanded="category.priority === 'essential'"
      />
    </div>

    <!-- Attorney Meeting Checklist -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Attorney Meeting Checklist</h2>
      <div class="space-y-4">
        <div v-for="group in attorneyMeetingChecklist" :key="group.category">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{{ group.category }}</h3>
          <ul class="space-y-1.5">
            <li v-for="item in group.items" :key="item" class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span class="mt-0.5 text-gray-400 dark:text-gray-500">&#9744;</span>
              {{ item }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Generate PDF -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Attorney Preparation Summary</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Generate a PDF summary of your vault data organized for an attorney meeting.
          Only non-sensitive information is included — no passwords, PINs, or seed phrases.
        </p>
      </div>
      <button
        @click="handleGeneratePdf"
        :disabled="generating || readiness.completed === 0"
        class="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
      >
        {{ generating ? 'Generating...' : 'Generate PDF' }}
      </button>
    </div>

    <WillPrepDisclaimer />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { estatePrepCategories, attorneyMeetingChecklist } from '@/data/willPrepCategories'
import { hasSectionData } from '@/composables/useSectionProgress'
import { useLegacyStore } from '@/store'
import { generateAttorneyPrepPdf } from '@/pdf/attorneyPrepPdf'
import WillPrepDisclaimer from '@/components/WillPrepDisclaimer.vue'
import WillPrepCategoryCard from '@/components/WillPrepCategory.vue'

const store = useLegacyStore()
const generating = ref(false)

// Deduplicate sections that appear in multiple categories (e.g. beneficiaries, property)
const uniqueSectionPaths = [...new Set(estatePrepCategories.flatMap(c => c.sections.map(s => s.path)))]

const readiness = computed(() => {
  const completed = uniqueSectionPaths.filter(p => hasSectionData(store.data, p)).length
  const total = uniqueSectionPaths.length
  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
})

const progressColorClass = computed(() => {
  if (readiness.value.percentage >= 100) return 'text-green-600'
  if (readiness.value.percentage >= 50) return 'text-blue-600'
  return 'text-gray-600'
})

const progressBarClass = computed(() => {
  if (readiness.value.percentage >= 100) return 'bg-green-500'
  if (readiness.value.percentage >= 50) return 'bg-blue-500'
  return 'bg-gray-400'
})

async function handleGeneratePdf() {
  if (!store.data || generating.value) return
  generating.value = true
  try {
    const bytes = await generateAttorneyPrepPdf(store.data)
    const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'attorney-preparation-summary.pdf'
    a.click()
    URL.revokeObjectURL(url)
  } finally {
    generating.value = false
  }
}
</script>
