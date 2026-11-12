<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import DramaGrid from '@renderer/components/drama/DramaGrid.vue'
import SectionHeader from '@renderer/components/drama/SectionHeader.vue'
import EpisodePanel from '@renderer/components/episode/EpisodePanel.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import StatusBlock from '@renderer/components/ui/StatusBlock.vue'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import { useFollowToggle, useShare } from '@renderer/composables/useFollowToggle'
import { useNav } from '@renderer/composables/useNav'
import {
  coverUrl,
  episodesText,
  heatText,
  kindOf,
  statusText,
  tagsOf,
  yearOf
} from '@renderer/services/format'
import { useHistoryStore } from '@renderer/stores/history'
import { useSeriesStore } from '@renderer/stores/series'

const route = useRoute()
const seriesStore = useSeriesStore()
const historyStore = useHistoryStore()
const { play } = useNav()
const share = useShare()

const id = computed(() => String(route.query.series_id ?? ''))
const series = computed(() => seriesStore.series.get(id.value))
const episodes = computed(() => seriesStore.episodes.get(id.value) ?? [])
const recommend = computed(() => seriesStore.recommends.get(id.value)?.items.slice(0, 6) ?? [])
const record = computed(() => historyStore.records[id.value])
const error = shallowRef<unknown>()

const { followed, toggle } = useFollowToggle(series)

const stats = computed(() => {
  const s = series.value
  const ep = episodesText(s)
  return [
    ep && (s?.right_text ? ep : `${ep} · ${statusText(s)}`),
    [kindOf(s), yearOf(s)].filter(Boolean).join(' · ')
  ].filter(Boolean)
})

async function load(): Promise<void> {
  const sid = id.value
  if (!sid) return
  error.value = undefined
  try {
    await Promise.all([seriesStore.ensureSeries(sid), seriesStore.ensureEpisodes(sid)])
    const rec = await seriesStore.ensureRecommend(sid).catch(() => undefined)
    if (rec) void seriesStore.prefetch(rec.items.slice(0, 6).map((i) => i.id))
  } catch (e) {
    error.value = e
  }
}

watch(id, load, { immediate: true })

const HEAD =
  'relative isolate flex min-h-[400px] items-center gap-10 overflow-hidden rounded-20 p-[26px] before:absolute before:inset-0 before:-z-1 before:bg-[rgba(15,15,20,0.82)]'
</script>

<template>
  <div class="flex flex-col gap-7">
    <StatusBlock v-if="error && !series" :error="error" @retry="load" />
    <section v-else-if="series" :class="HEAD">
      <img
        class="absolute -inset-10 -z-1 h-[calc(100%+80px)] w-[calc(100%+80px)] object-cover blur-[40px] saturate-120"
        :src="coverUrl(series.cover_url, 200)"
        alt=""
      />
      <img
        class="h-80 w-56 flex-none rounded-14 object-cover shadow-poster"
        :src="coverUrl(series.cover_url, 480)"
        :alt="series.title"
      />
      <div class="flex max-w-[800px] min-w-0 flex-col gap-3.5">
        <nav class="text-12 text-fg-4b">
          <RouterLink to="/" class="hover:text-fg-1">首页</RouterLink> /
          <RouterLink to="/rank" class="hover:text-fg-1">热播短剧</RouterLink> /
          <span>{{ kindOf(series) }}</span>
        </nav>
        <h1 class="text-36 leading-[1.25] font-black text-fg-1">{{ series.title }}</h1>
        <p class="flex flex-wrap gap-5 text-14 font-medium text-fg-2c">
          <b v-if="series.heat" class="text-brand-soft">{{ heatText(series.heat) }}</b>
          <span v-for="s in stats" :key="s">{{ s }}</span>
        </p>
        <p v-if="tagsOf(series, 6).length" class="flex flex-wrap gap-2">
          <span v-for="t in tagsOf(series, 6)" :key="t" class="tag">{{ t }}</span>
        </p>
        <p class="line-clamp-3 max-w-[680px] text-14 leading-[1.7] text-fg-3b">
          {{ series.description }}
        </p>
        <div class="mt-1.5 flex gap-3">
          <BaseButton icon="play" @click="play(id, record?.epNumber)">
            {{ record ? `继续看 第 ${record.epNumber} 集` : '立即播放' }}
          </BaseButton>
          <BaseButton
            variant="glass"
            :class="{ '[&_svg]:animate-beat [&_svg]:text-brand': followed }"
            :icon="followed ? 'heart' : 'heart-line'"
            @click="toggle"
          >
            {{ followed ? '已追剧' : '追剧' }}
          </BaseButton>
          <button
            class="grid size-[46px] place-items-center rounded-full bg-white/12 text-fg-1 transition-colors duration-150 hover:bg-white/25"
            title="分享"
            @click="share(series.title)"
          >
            <AppIcon name="share" :size="18" />
          </button>
        </div>
      </div>
    </section>
    <div v-else class="skeleton" :class="HEAD" />

    <EpisodePanel
      v-if="episodes.length"
      :episodes="episodes"
      :current="record?.epNumber"
      @pick="(ep) => play(id, ep.number)"
    />

    <section v-if="recommend.length">
      <SectionHeader
        :title="seriesStore.recommends.get(id)?.cell_title || '看了这部的人还在看'"
        more="查看全部"
        :to="{ name: 'category' }"
      />
      <DramaGrid class="[--drama-cols:repeat(6,1fr)]" :items="recommend" />
    </section>
  </div>
</template>
