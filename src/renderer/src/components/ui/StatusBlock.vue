<script setup lang="ts">
import { errorText } from '@renderer/services/api'
import BaseButton from './BaseButton.vue'

const { error, empty } = defineProps<{ error?: unknown; empty?: string }>()
const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div
    class="flex min-h-40 flex-col items-center justify-center gap-3.5 rounded-16 bg-panel p-6 text-center text-13 text-fg-4b"
  >
    <template v-if="error">
      <p>{{ errorText(error) }}</p>
      <BaseButton variant="ghost" size="sm" icon="refresh" @click="emit('retry')">重试</BaseButton>
    </template>
    <p v-else>{{ empty }}</p>
    <slot />
  </div>
</template>
