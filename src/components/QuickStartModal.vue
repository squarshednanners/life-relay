<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-2">
            <LifeRelayLogo size="md" />
            <h2 class="text-xl font-semibold">Welcome to Life Relay</h2>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Organize your critical information so your loved ones aren't left guessing.
            Everything stays on your device — no accounts, no servers.
          </p>
        </div>

        <div class="p-6 space-y-3">
          <button
            type="button"
            @click="$emit('import')"
            class="w-full px-4 py-3 text-left border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
          >
            <div class="font-medium text-gray-900 dark:text-gray-100">Import Existing Vault</div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Restore from a previously exported .json file</p>
          </button>
          <button
            type="button"
            @click="$emit('cancel')"
            class="w-full px-4 py-3 text-left border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
          >
            <div class="font-medium text-gray-900 dark:text-gray-100">Start Fresh</div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Begin filling in sections from scratch</p>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import LifeRelayLogo from '@/components/LifeRelayLogo.vue'

defineProps<{
  isOpen: boolean
}>()

defineEmits<{
  cancel: []
  import: []
}>()
</script>
