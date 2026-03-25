<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center gap-2">
            <LifeRelayLogo size="md" />
            <h2 class="text-xl font-semibold">Welcome to Life Relay</h2>
          </div>
          <p class="text-sm text-gray-500 mt-1">
            Choose a starting template, import an existing vault, or start from scratch.
          </p>
        </div>

        <div class="overflow-y-auto flex-1 p-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              v-for="template in templates"
              :key="template.id"
              @click="selectTemplate(template)"
              class="text-left p-4 border-2 rounded-lg transition-colors hover:border-primary-400 hover:bg-primary-50"
              :class="selected?.id === template.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200'"
            >
              <div class="text-2xl mb-2">{{ template.icon }}</div>
              <div class="font-medium text-gray-900">{{ template.name }}</div>
              <p class="text-xs text-gray-500 mt-1">{{ template.description }}</p>
            </button>
          </div>
        </div>

        <div class="p-6 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            @click="$emit('import')"
            class="px-4 py-2 text-primary-700 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 transition-colors text-sm"
          >
            Import Existing Vault
          </button>
          <div class="flex gap-3">
          <button
            type="button"
            @click="$emit('cancel')"
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Skip
          </button>
          <button
            type="button"
            @click="confirm"
            :disabled="!selected"
            class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            Get Started
          </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { quickStartTemplates, type QuickStartTemplate } from '@/data/quickStartTemplates'
import LifeRelayLogo from '@/components/LifeRelayLogo.vue'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  cancel: []
  select: [template: QuickStartTemplate]
  import: []
}>()

const templates = quickStartTemplates
const selected = ref<QuickStartTemplate | null>(null)

function selectTemplate(template: QuickStartTemplate) {
  selected.value = template
}

function confirm() {
  if (selected.value) {
    emit('select', selected.value)
  }
}
</script>
