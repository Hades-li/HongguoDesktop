<script setup lang="ts">
import type { RankChange } from 'openhongguo'

const { change } = defineProps<{ change?: RankChange }>()
</script>

<template>
  <span
    v-if="!change || change.kind === 3"
    class="font-num text-13 font-medium whitespace-nowrap text-trend-down"
    >—</span
  >
  <span
    v-else-if="change.kind === 0"
    class="font-num text-13 font-semibold whitespace-nowrap text-trend-new"
    >NEW</span
  >
  <span
    v-else
    class="font-num text-13 font-medium whitespace-nowrap"
    :class="change.kind === 1 ? 'text-trend-up' : 'text-trend-down'"
  >
    {{ change.kind === 1 ? '↑' : '↓' }} {{ change.places }}
  </span>
</template>
