<template>
  <div class="space-y-6">
    <!-- Overall Progress -->
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold">Overall Progress</h3>
        <span class="text-2xl font-bold" :class="overallColorClass">
          {{ overallProgress.percentage }}%
        </span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-3">
        <div
          class="h-3 rounded-full transition-all duration-500"
          :class="overallBarClass"
          :style="{ width: overallProgress.percentage + '%' }"
        ></div>
      </div>
      <p class="text-sm text-gray-500 mt-2">
        {{ overallProgress.completed }} of {{ overallProgress.total }} sections completed
      </p>

      <!-- Suggested Next Section -->
      <div v-if="suggestedNextSection" class="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
        <p class="text-sm text-primary-700">
          <span class="font-medium">Suggested next:</span>
          <router-link
            :to="suggestedNextSection.path"
            class="ml-1 underline hover:text-primary-900"
          >
            {{ suggestedNextSection.name }}
          </router-link>
        </p>
      </div>
    </div>

    <!-- Group Progress -->
    <div class="bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold mb-4">Progress by Section</h3>
      <div class="space-y-5">
        <div v-for="group in groupProgress" :key="group.name">
          <div class="flex items-center justify-between mb-1">
            <h4 class="text-sm font-semibold text-gray-700">{{ group.name }}</h4>
            <span class="text-xs font-medium" :class="groupColorClass(group.percentage)">
              {{ group.completed }}/{{ group.total }}
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              class="h-2 rounded-full transition-all duration-500"
              :class="groupBarClass(group.percentage)"
              :style="{ width: group.percentage + '%' }"
            ></div>
          </div>
          <!-- Individual sections -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1 ml-1">
            <div
              v-for="item in group.items"
              :key="item.path"
              class="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-gray-50 group"
            >
              <router-link
                :to="item.path"
                class="flex items-center gap-2 text-gray-600 hover:text-primary-700 flex-1 min-w-0"
              >
                <span class="flex-shrink-0">
                  <svg
                    v-if="isSectionComplete(item.path) && !isSectionSkipped(item.path)"
                    class="w-4 h-4 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <svg
                    v-else-if="isSectionSkipped(item.path)"
                    class="w-4 h-4 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                      clip-rule="evenodd"
                      transform="rotate(-90 10 10)"
                    />
                  </svg>
                  <span v-else class="w-4 h-4 inline-block rounded-full border-2 border-gray-300"></span>
                </span>
                <span class="truncate" :class="{ 'line-through text-gray-400': isSectionSkipped(item.path) }">
                  {{ item.name }}
                </span>
              </router-link>
              <button
                @click.prevent="toggleSkipSection(item.path)"
                class="text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2"
                :class="isSectionSkipped(item.path)
                  ? 'text-primary-600 hover:text-primary-800 hover:bg-primary-50'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'"
                :title="isSectionSkipped(item.path) ? 'Unskip this section' : 'Skip — not applicable'"
              >
                {{ isSectionSkipped(item.path) ? 'Unskip' : 'Skip' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSectionProgress } from '@/composables/useSectionProgress'

const {
  isSectionSkipped,
  isSectionComplete,
  toggleSkipSection,
  groupProgress,
  overallProgress,
  suggestedNextSection,
} = useSectionProgress()

const overallColorClass = computed(() => {
  const p = overallProgress.value.percentage
  if (p === 100) return 'text-green-600'
  if (p >= 60) return 'text-primary-600'
  if (p >= 30) return 'text-yellow-600'
  return 'text-gray-600'
})

const overallBarClass = computed(() => {
  const p = overallProgress.value.percentage
  if (p === 100) return 'bg-green-500'
  if (p >= 60) return 'bg-primary-500'
  if (p >= 30) return 'bg-yellow-500'
  return 'bg-gray-400'
})

function groupColorClass(percentage: number): string {
  if (percentage === 100) return 'text-green-600'
  if (percentage > 0) return 'text-yellow-600'
  return 'text-gray-400'
}

function groupBarClass(percentage: number): string {
  if (percentage === 100) return 'bg-green-500'
  if (percentage > 0) return 'bg-yellow-500'
  return 'bg-gray-300'
}

import { computed } from 'vue'
</script>
