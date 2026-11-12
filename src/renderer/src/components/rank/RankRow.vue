<script setup lang="ts">
import { computed } from 'vue'
import type { RankItem } from 'openhongguo'
import { useNav } from '@renderer/composables/useNav'
import { coverUrl, episodesText, rankNo, tagsOf } from '@renderer/services/format'
import { useSeriesStore } from '@renderer/stores/series'
import TrendBadge from './TrendBadge.vue'

const { item } = defineProps<{ item: RankItem }>()

const { openDetail, play } = useNav()
const seriesStore = useSeriesStore()
const detail = computed(() => seriesStore.series.get(item.series_id ?? ''))
const meta = computed(() =>
  [...tagsOf(detail.value, 2), episodesText(detail.value ?? item)].filter(Boolean).join(' · ')
)
</script>

<template>
  <div
    class="group/row flex cursor-pointer items-center gap-[18px] rounded-10 px-6 py-3 transition-colors duration-150 hover:bg-card-2"
    @click="openDetail(item.series_id!)"
  >
    <span class="w-10 flex-none font-rank text-34 leading-none text-fg-5">
      {{ rankNo(item.position ?? 0) }}
    </span>
    <img
      class="h-[76px] w-[54px] flex-none rounded-6 bg-card object-cover"
      :src="coverUrl(item.cover_url, 200)"
      :alt="item.title"
      loading="lazy"
    />
    <div class="flex min-w-0 flex-1 flex-col gap-1.5">
      <h3 class="truncate text-15 font-medium text-fg-1">{{ item.title }}</h3>
      <p class="truncate text-12 text-fg-4b">
        {{ meta }}
        <template v-if="detail?.description">
          <i class="mx-3 text-rank-dim not-italic">|</i>{{ detail.description }}
        </template>
      </p>
    </div>
    <span class="w-[110px] flex-none text-right text-13 font-medium text-fg-3">
      {{ item.score }}
    </span>
    <TrendBadge class="w-11 flex-none text-center" :change="item.change" />
    <button
      class="flex-none rounded-16 bg-ghost px-4 py-[7px] text-12 font-medium text-fg-1 transition-colors duration-150 group-hover/row:bg-brand"
      @click.stop="play(item.series_id!)"
    >
      立即观看
    </button>
  </div>
</template>
