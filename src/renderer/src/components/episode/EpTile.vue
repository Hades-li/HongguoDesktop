<script setup lang="ts">
const { number, state = 'unseen' } = defineProps<{
  number: number
  state?: 'unseen' | 'seen' | 'current'
}>()

const HOVER = 'hover:border-white/35 hover:bg-tile-hover hover:font-semibold hover:text-fg-1'
const STATES = {
  unseen: `bg-tile font-medium text-fg-2b ${HOVER}`,
  seen: `bg-card-2 text-fg-5 ${HOVER}`,
  current: 'border-brand bg-brand/16 font-bold text-brand'
}
</script>

<template>
  <button
    class="inline-flex h-11 items-center justify-center gap-1.5 rounded-10 border border-transparent font-num text-14 transition-colors duration-150"
    :class="STATES[state]"
  >
    <span v-if="state === 'current'" class="inline-flex h-[11px] items-end gap-0.5">
      <i
        v-for="d in [0, -0.3, -0.6]"
        :key="d"
        class="h-full w-0.5 origin-bottom animate-eq rounded-[1px] bg-current"
        :style="{ animationDelay: `${d}s` }"
      />
    </span>
    {{ number }}
  </button>
</template>
