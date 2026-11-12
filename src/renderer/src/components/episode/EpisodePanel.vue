<script setup lang="ts">
import { toRef } from 'vue'
import type { Episode } from 'openhongguo'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import { useEpisodeRanges } from '@renderer/composables/useEpisodeRanges'
import { RANGE_SIZE } from '@shared/constants'
import EpisodeGrid from './EpisodeGrid.vue'
import EpisodeRangeTabs from './EpisodeRangeTabs.vue'

/** 详情页选集：50 一段、正序 / 倒序、图例 */
const { episodes, current } = defineProps<{ episodes: Episode[]; current?: number }>()
const emit = defineEmits<{ pick: [ep: Episode] }>()

const { index, reverse, ranges, visible } = useEpisodeRanges(
  toRef(() => episodes),
  RANGE_SIZE.detail,
  toRef(() => current)
)
</script>

<template>
  <section class="flex flex-col gap-4 rounded-16 bg-panel p-6">
    <header class="flex items-center gap-5">
      <h2 class="flex-none text-20 font-bold text-fg-1">选集</h2>
      <EpisodeRangeTabs v-model="index" :ranges="ranges" />
      <button
        class="ml-auto inline-flex flex-none items-center gap-1 text-13 text-fg-3b hover:text-fg-1"
        @click="reverse = !reverse"
      >
        {{ reverse ? '倒序' : '正序' }} <AppIcon name="sort" :size="14" />
      </button>
    </header>
    <EpisodeGrid
      :episodes="visible"
      :current="current"
      :seen-up-to="current"
      @pick="(ep) => emit('pick', ep)"
    />
    <p class="text-12 text-fg-5">灰色 = 已看过 · 红框 = 上次看到 · 悬停高亮，单击直接进入播放页</p>
  </section>
</template>
