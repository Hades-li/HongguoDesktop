<script setup lang="ts">
import { computed } from 'vue'
import type { RankItem } from 'openhongguo'
import { useNav } from '@renderer/composables/useNav'
import { coverUrl, episodesText, rankNo, tagsOf } from '@renderer/services/format'
import { useSeriesStore } from '@renderer/stores/series'
import TrendBadge from './TrendBadge.vue'

const { item, place } = defineProps<{ item: RankItem; place: 1 | 2 | 3 }>()

const { openDetail } = useNav()
const seriesStore = useSeriesStore()
const detail = computed(() => seriesStore.series.get(item.series_id ?? ''))
const meta = computed(() =>
  [...tagsOf(detail.value, 2), episodesText(detail.value ?? item)].filter(Boolean).join(' · ')
)

/** --c 主题色、--a 渐变起点混色比例；用于边框与背景 */
const PLACES = {
  1: { card: '[--a:0.28] [--c:#ff2e54]', no: 'text-brand', heat: 'text-brand-soft' },
  2: { card: '[--a:0.22] [--c:#ff6b3d]', no: 'text-brand-2', heat: 'text-[#ff8a5c]' },
  3: { card: '[--a:0.18] [--c:#ffbf4d]', no: 'text-trend-new', heat: 'text-fg-4' }
}
</script>

<template>
  <article
    class="flex min-w-0 cursor-pointer gap-[18px] rounded-16 border border-[color-mix(in_srgb,var(--c)_70%,transparent)] bg-[linear-gradient(150deg,color-mix(in_srgb,var(--c)_calc(var(--a)*100%),#1a1a21)_0%,#1a1a21_45%)] p-[18px] transition-transform duration-200 ease-out hover:-translate-y-1"
    :class="PLACES[place].card"
    @click="openDetail(item.series_id!)"
  >
    <img
      class="h-[186px] w-[132px] flex-none rounded-10 bg-card object-cover"
      :src="coverUrl(item.cover_url)"
      :alt="item.title"
    />
    <div class="flex min-w-0 flex-1 flex-col gap-2">
      <span class="font-rank text-56 leading-none" :class="PLACES[place].no">
        {{ rankNo(place) }}
      </span>
      <h3 class="line-clamp-2 text-17 font-bold text-fg-1">{{ item.title }}</h3>
      <p class="truncate text-12 text-fg-4">{{ meta }}</p>
      <div class="mt-auto flex gap-2">
        <span class="text-13 font-medium" :class="PLACES[place].heat">{{ item.score }}</span>
        <TrendBadge :change="item.change" />
      </div>
    </div>
  </article>
</template>
