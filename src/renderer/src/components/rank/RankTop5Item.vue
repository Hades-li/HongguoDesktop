<script setup lang="ts">
import type { RankItem } from 'openhongguo'
import { useNav } from '@renderer/composables/useNav'
import { coverUrl } from '@renderer/services/format'

const { item, place } = defineProps<{ item: RankItem; place: number }>()
const { openDetail } = useNav()

const NO_COLORS: Record<number, string> = {
  1: 'text-brand',
  2: 'text-[#ff7a45]',
  3: 'text-brand-3'
}
</script>

<template>
  <div class="group/top relative h-[210px] cursor-pointer" @click="openDetail(item.series_id!)">
    <span
      class="absolute -bottom-3.5 left-0 font-rank text-[150px] leading-none"
      :class="NO_COLORS[place] ?? 'text-rank-dim'"
    >
      {{ place }}
    </span>
    <img
      class="absolute top-0 right-0 h-full w-[66%] rounded-10 bg-card object-cover shadow-poster transition-transform duration-200 ease-out group-hover/top:-translate-y-1"
      :src="coverUrl(item.cover_url)"
      :alt="item.title"
      :title="item.title"
      loading="lazy"
    />
  </div>
</template>
