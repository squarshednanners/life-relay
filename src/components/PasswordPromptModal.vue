<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="handleCancel"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{{ title }}</h2>
        <p v-if="description" class="text-gray-600 dark:text-gray-400 mb-4">{{ description }}</p>

        <form @submit.prevent="handleSubmit">
          <div class="mb-4">
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ confirmLabel ? 'Password' : 'Password' }}
            </label>
            <input
              id="password"
              ref="passwordInput"
              v-model="password"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              :placeholder="placeholder || 'Enter password'"
              autocomplete="new-password"
            />
          </div>

          <div v-if="confirmLabel" class="mb-4">
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ confirmLabel }}
            </label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              :placeholder="confirmPlaceholder || 'Confirm password'"
              autocomplete="new-password"
            />
          </div>

          <div v-if="error" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
          </div>

          <div class="flex gap-3 justify-end">
            <button
              type="button"
              @click="handleCancel"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              v-if="showSkip"
              type="button"
              @click="handleSkip"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {{ skipLabel || 'Skip' }}
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              {{ submitLabel || 'Confirm' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  isOpen: boolean
  title?: string
  description?: string
  placeholder?: string
  confirmLabel?: string
  confirmPlaceholder?: string
  submitLabel?: string
  showSkip?: boolean
  skipLabel?: string
}>()

const emit = defineEmits<{
  confirm: [password: string]
  cancel: []
  skip: []
}>()

const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const passwordInput = ref<HTMLInputElement | null>(null)

// Focus password input when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    password.value = ''
    confirmPassword.value = ''
    error.value = ''
    nextTick(() => {
      passwordInput.value?.focus()
    })
  }
})

function handleSubmit() {
  error.value = ''

  // Validate password
  if (!password.value || password.value.length === 0) {
    error.value = 'Password cannot be empty'
    return
  }

  // If confirmation is required, validate match
  if (props.confirmLabel) {
    if (password.value !== confirmPassword.value) {
      error.value = 'Passwords do not match'
      return
    }

    if (password.value.length < 2) {
      error.value = 'Password must be at least 2 characters long'
      return
    }
  }

  emit('confirm', password.value)
}

function handleCancel() {
  password.value = ''
  confirmPassword.value = ''
  error.value = ''
  emit('cancel')
}

function handleSkip() {
  password.value = ''
  confirmPassword.value = ''
  error.value = ''
  emit('skip')
}
</script>
