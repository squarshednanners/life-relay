<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    :class="sizeClass"
    class="inline-block flex-shrink-0"
  >
    <template v-if="variant === 'light'">
      <rect width="512" height="512" rx="80" fill="white"/>
      <!-- Left arc (giver) -->
      <path d="M120 360 C120 220 200 140 256 140" fill="none" stroke="#0f766e" stroke-width="36" stroke-linecap="round" opacity="0.45"/>
      <!-- Right arc (receiver) -->
      <path d="M256 372 C312 372 392 292 392 152" fill="none" stroke="#0f766e" stroke-width="36" stroke-linecap="round" opacity="0.45"/>
      <!-- Baton -->
      <rect x="196" y="222" width="120" height="40" rx="20" transform="rotate(-45 256 242)" fill="#0f766e"/>
    </template>
    <template v-else>
      <rect width="512" height="512" rx="80" fill="#0f766e"/>
      <!-- Left arc (giver) -->
      <path d="M120 360 C120 220 200 140 256 140" fill="none" stroke="white" stroke-width="36" stroke-linecap="round" opacity="0.35"/>
      <!-- Right arc (receiver) -->
      <path d="M256 372 C312 372 392 292 392 152" fill="none" stroke="white" stroke-width="36" stroke-linecap="round" opacity="0.35"/>
      <!-- Baton -->
      <rect x="196" y="222" width="120" height="40" rx="20" transform="rotate(-45 256 242)" fill="white"/>
    </template>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'light'
}>(), {
  size: 'md',
  variant: 'default',
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-6 h-6'
    case 'md': return 'w-8 h-8'
    case 'lg': return 'w-12 h-12'
    case 'xl': return 'w-16 h-16'
  }
})
</script>
