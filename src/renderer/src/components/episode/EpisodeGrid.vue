<script setup lang="ts">
import type { Episode } from 'openhongguo'
import EpTile from './EpTile.vue'

const {
  episodes,
  current,
  seenUpTo = 0,
  tile = 101,
  gap = 10
} = defineProps<{
  episodes: Episode[]
  current?: number
  /** 小于该集号的视为已看 */
  seenUpTo?: number
  tile?: number
  gap?: number
}>()
const emit = defineEmits<{ pick: [ep: Episode] }>()

const stateOf = (n: number): 'current' | 'seen' | 'unseen' =>
  n === current ? 'current' : n < seenUpTo ? 'seen' : 'unseen'
</script>

<template>
  <div
    class="grid grid-cols-[repeat(auto-fill,minmax(var(--tile),1fr))]"
    :style="{ '--tile': `${tile}px`, gap: `${gap}px` }"
  >
    <EpTile
      v-for="ep in episodes"
      :key="ep.id"
      :number="ep.number"
      :state="stateOf(ep.number)"
      :title="ep.title"
      @click="emit('pick', ep)"
    />
  </div>
</template>
