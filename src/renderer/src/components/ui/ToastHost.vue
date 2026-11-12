<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUiStore } from '@renderer/stores/ui'

const { toasts } = storeToRefs(useUiStore())
</script>

<template>
  <TransitionGroup
    tag="div"
    name="pop"
    class="pointer-events-none fixed top-18 left-1/2 z-100 flex -translate-x-1/2 flex-col items-center gap-2"
  >
    <div
      v-for="t in toasts"
      :key="t.id"
      class="rounded-full border border-white/10 bg-[rgba(30,30,38,0.92)] px-5 py-2.5 text-13 text-fg-1 shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-md"
    >
      {{ t.text }}
    </div>
  </TransitionGroup>
</template>
