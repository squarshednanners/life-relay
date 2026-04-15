<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <SectionHeader
      title="For My Family"
      description="A step-by-step runbook for your family or executor to follow after your death — the recommended sequence of actions when reading this vault."
    />

    <!-- Intro -->
    <div class="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-5">
      <h3 class="text-base font-semibold text-primary-900 dark:text-primary-200 mb-2">If you are reading this after a loss</h3>
      <p class="text-sm text-primary-800 dark:text-primary-300 leading-relaxed">
        First — take a breath. Almost nothing has to happen in the next hour. The steps below are organized by urgency,
        but most can wait a day or two. Lean on family and friends. Print this page and the full vault PDF for offline reference.
      </p>
      <button
        @click="generateRunbookPdf"
        :disabled="generating"
        class="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm font-medium"
      >
        {{ generating ? 'Generating...' : 'Download Runbook PDF' }}
      </button>
    </div>

    <!-- Phases -->
    <div v-for="phase in phases" :key="phase.id" class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ phase.title }}</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{{ phase.subtitle }}</p>
      </div>
      <ol class="divide-y divide-gray-200 dark:divide-gray-700">
        <li v-for="(step, idx) in phase.steps" :key="idx" class="px-6 py-4 flex gap-4">
          <div class="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 flex items-center justify-center text-sm font-semibold">
            {{ idx + 1 }}
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900 dark:text-gray-100">{{ step.title }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{{ step.description }}</p>
            <div v-if="step.references && step.references.length" class="mt-2 flex flex-wrap gap-1.5">
              <router-link
                v-for="ref in step.references"
                :key="ref.path"
                :to="ref.path"
                class="text-xs px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
              >
                {{ ref.label }}
              </router-link>
            </div>
          </div>
        </li>
      </ol>
    </div>

    <!-- Important Don'ts -->
    <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-6">
      <h2 class="text-lg font-bold text-amber-900 dark:text-amber-200 mb-3">Important Don'ts</h2>
      <ul class="space-y-2.5">
        <li v-for="(item, idx) in donts" :key="idx" class="flex gap-3 text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
          <span class="flex-shrink-0 mt-0.5">•</span>
          <span>{{ item }}</span>
        </li>
      </ul>
    </div>

    <!-- Quick contacts at a glance -->
    <div v-if="quickContacts.length" class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
      <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">Key People to Contact</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Pulled from your Important Contacts. Call these people first.</p>
      <div class="grid sm:grid-cols-2 gap-3">
        <div v-for="(contact, idx) in quickContacts" :key="idx" class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div class="font-semibold text-gray-900 dark:text-gray-100 text-sm">{{ contact.name }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">{{ contact.role }}</div>
          <div v-if="contact.phone" class="text-xs text-gray-700 dark:text-gray-300 mt-1">{{ contact.phone }}</div>
        </div>
      </div>
    </div>

    <p class="text-center text-xs text-gray-400 dark:text-gray-500 italic">
      This runbook is general guidance, not legal advice. Specific obligations vary by state and by the deceased's circumstances.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLegacyStore } from '@/store'
import SectionHeader from '@/components/SectionHeader.vue'
import { runbookPhases, runbookDonts } from '@/data/runbookSteps'
import { generateRunbookPdfDocument } from '@/pdf/runbookPdf'

const store = useLegacyStore()
const phases = runbookPhases
const donts = runbookDonts
const generating = ref(false)

// Pull executor, attorney, primary doctor, and trustee out of important contacts
const PRIORITY_ROLES = ['Executor', 'Attorney', 'Trustee', 'Doctor', 'Accountant / CPA', 'Financial Advisor']

const quickContacts = computed(() => {
  const contacts = (store.data?.importantContacts as any[]) || []
  const filtered = contacts.filter(c => c.role && PRIORITY_ROLES.some(r => c.role.toLowerCase().includes(r.toLowerCase())))
  // Sort by priority order
  return filtered.sort((a, b) => {
    const aIdx = PRIORITY_ROLES.findIndex(r => a.role.toLowerCase().includes(r.toLowerCase()))
    const bIdx = PRIORITY_ROLES.findIndex(r => b.role.toLowerCase().includes(r.toLowerCase()))
    return aIdx - bIdx
  })
})

async function generateRunbookPdf() {
  if (!store.data || generating.value) return
  generating.value = true
  try {
    const bytes = await generateRunbookPdfDocument(store.data)
    const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'life-relay-runbook.pdf'
    a.click()
    URL.revokeObjectURL(url)
  } finally {
    generating.value = false
  }
}
</script>
