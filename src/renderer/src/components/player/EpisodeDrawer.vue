<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import type { Episode, Series } from 'openhongguo'
import DramaCard from '@renderer/components/drama/DramaCard.vue'
import EpisodeGrid from '@renderer/components/episode/EpisodeGrid.vue'
import EpisodeRangeTabs from '@renderer/components/episode/EpisodeRangeTabs.vue'
import SegmentControl from '@renderer/components/ui/SegmentControl.vue'
import Toggle from '@renderer/components/ui/Toggle.vue'
import { useEpisodeRanges } from '@renderer/composables/useEpisodeRanges'
import { useNav } from '@renderer/composables/useNav'
import {
  coverUrl,
  episodesText,
  heatText,
  kindOf,
  tagsOf,
  type DramaItem
} from '@renderer/services/format'
import { usePlayerStore } from '@renderer/stores/player'
import { RANGE_SIZE } from '@shared/constants'
import NextEpisodeCard from './NextEpisodeCard.vue'

const { series, episodes, current, next, countdown } = defineProps<{
  series?: Series
  episodes: Episode[]
  current: number
  next?: Episode
  countdown?: number
  related: DramaItem[]
}>()
const emit = defineEmits<{ pick: [ep: Episode]; cancelCountdown: [] }>()

const store = usePlayerStore()
const { openDetail } = useNav()
const tab = ref<'episodes' | 'related'>('episodes')
const tabs = [
  { value: 'episodes' as const, label: '选集' },
  { value: 'related' as const, label: '相关推荐' }
]
const { index, ranges, visible } = useEpisodeRanges(
  toRef(() => episodes),
  RANGE_SIZE.drawer,
  toRef(() => current)
)

const sub = computed(() =>
  [
    kindOf(series) === '漫剧' ? '' : tagsOf(series, 1)[0],
    episodesText(series),
    heatText(series?.heat)
  ]
    .filter(Boolean)
    .join(' · ')
)

const BODY = 'min-h-0 flex-1 overflow-y-auto -mr-2.5 pr-2.5'
</script>

<template>
  <aside
    class="flex h-full w-drawer flex-none flex-col gap-[18px] border-l border-white/6 bg-drawer px-6 pt-7 pb-6"
  >
    <header class="flex gap-3.5">
      <img
        class="h-[88px] w-16 flex-none rounded-8 bg-card object-cover"
        :src="coverUrl(series?.cover_url, 200)"
        alt=""
      />
      <div class="flex min-w-0 flex-col gap-1.5 pt-0.5">
        <h3 class="line-clamp-2 text-16 font-bold text-fg-1">{{ series?.title }}</h3>
        <p class="text-12 text-fg-4b">{{ sub }}</p>
        <button
          class="self-start text-12 font-medium text-brand-soft"
          @click="series && openDetail(series.id)"
        >
          查看简介 →
        </button>
      </div>
    </header>

    <SegmentControl v-model="tab" :options="tabs" block />

    <div v-if="tab === 'episodes'" class="flex flex-col gap-4" :class="BODY">
      <EpisodeRangeTabs v-model="index" :ranges="ranges" size="sm" />
      <EpisodeGrid
        :episodes="visible"
        :current="current"
        :seen-up-to="current"
        :tile="56"
        :gap="8"
        @pick="(ep) => emit('pick', ep)"
      />
      <NextEpisodeCard
        v-if="next"
        :episode="next"
        :countdown="countdown"
        @play="emit('pick', next)"
        @cancel="emit('cancelCountdown')"
      />
    </div>
    <div
      v-else
      class="grid grid-cols-[repeat(2,1fr)] content-start gap-x-3 gap-y-[18px]"
      :class="BODY"
    >
      <DramaCard v-for="it in related" :key="it.id" :item="it" />
    </div>

    <label class="flex items-center justify-between rounded-12 bg-card p-3.5 text-13 text-fg-2b">
      自动连播下一集
      <Toggle v-model="store.autoNext" />
    </label>
  </aside>
</template>
