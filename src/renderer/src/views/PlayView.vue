<script setup lang="ts">
import { useThrottleFn } from '@vueuse/core'
import { computed, provide, ref, shallowRef, toRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BackPill from '@renderer/components/player/BackPill.vue'
import EpisodeDrawer from '@renderer/components/player/EpisodeDrawer.vue'
import LandscapeMoreRow from '@renderer/components/player/LandscapeMoreRow.vue'
import PlayerActions from '@renderer/components/player/PlayerActions.vue'
import PlayerInfoBar from '@renderer/components/player/PlayerInfoBar.vue'
import VideoStage from '@renderer/components/player/VideoStage.vue'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import StatusBlock from '@renderer/components/ui/StatusBlock.vue'
import { useFollowToggle, useShare } from '@renderer/composables/useFollowToggle'
import { useKeymap } from '@renderer/composables/useHotkeys'
import { usePlayback } from '@renderer/composables/usePlayback'
import { useAutoNext, usePlayHistory } from '@renderer/composables/usePlaySession'
import { PLAYER_KEY, useVideoPlayer } from '@renderer/composables/useVideoPlayer'
import { countText, coverUrl } from '@renderer/services/format'
import { isMac } from '@renderer/services/platform'
import { episodeTitle, layoutOf, qualityLabel } from '@renderer/services/stream'
import { useFollowStore } from '@renderer/stores/follow'
import { useHistoryStore } from '@renderer/stores/history'
import { usePlayerStore } from '@renderer/stores/player'
import { useSeriesStore } from '@renderer/stores/series'

const route = useRoute()
const router = useRouter()
const seriesStore = useSeriesStore()
const historyStore = useHistoryStore()
const store = usePlayerStore()
const share = useShare()

/* ---------- 数据 ---------- */
const id = computed(() => String(route.query.series_id ?? ''))
const series = computed(() => seriesStore.series.get(id.value))
const episodes = computed(() => seriesStore.episodes.get(id.value) ?? [])
const related = computed(() => seriesStore.recommends.get(id.value)?.items ?? [])
const loadError = shallowRef<unknown>()

const epNo = computed(() => {
  const n = Number(route.query.ep) || historyStore.records[id.value]?.epNumber || 1
  return n >= 1 && n <= (episodes.value.length || n) ? n : 1
})
const episode = computed(() => episodes.value.find((e) => e.number === epNo.value))
const nextEp = computed(() => episodes.value.find((e) => e.number === epNo.value + 1))
const prevEp = computed(() => episodes.value.find((e) => e.number === epNo.value - 1))

async function load(): Promise<void> {
  loadError.value = undefined
  try {
    await Promise.all([seriesStore.ensureSeries(id.value), seriesStore.ensureEpisodes(id.value)])
    useFollowStore().markSeen(id.value)
    const rec = await seriesStore.ensureRecommend(id.value).catch(() => undefined)
    if (rec) void seriesStore.prefetch(rec.items.slice(0, 8).map((i) => i.id))
  } catch (e) {
    loadError.value = e
  }
}
watch(id, load, { immediate: true })

/* ---------- 播放 ---------- */
const { stream, loading, error, resolve, resetDevice, refreshIfExpired, cycleQuality } =
  usePlayback(episode)
const startAt = computed(() => {
  const r = historyStore.records[id.value]
  return r?.episodeId === episode.value?.id ? r.positionSec : 0
})
const player = useVideoPlayer(stream, startAt)
provide(PLAYER_KEY, player)

const layout = computed(() => layoutOf(stream.value, episode.value))
const quality = computed(() => qualityLabel(stream.value))
const { followed, toggle: toggleFollow } = useFollowToggle(series)
const liked = ref(false)
const { save } = usePlayHistory(series, episode, player)

/* ---------- 切集 / 自动连播 ---------- */
const direction = ref<'next' | 'prev'>('next')
const autoNext = useAutoNext(
  toRef(store, 'autoNext'),
  () => !!nextEp.value,
  () => goNext()
)
player.onEnded(autoNext.start)

function go(n: number): void {
  if (n === epNo.value || !episodes.value.some((e) => e.number === n)) return
  autoNext.cancel()
  save()
  direction.value = n > epNo.value ? 'next' : 'prev'
  void router.replace({ query: { ...route.query, ep: n } })
}
const goNext = (): void => nextEp.value && go(nextEp.value.number)
const goPrev = (): void => prevEp.value && go(prevEp.value.number)
watch(
  () => player.mediaError,
  (e) => e && refreshIfExpired()
)

function back(): void {
  const prev = window.history.state?.back
  if (typeof prev === 'string' && prev.startsWith('/detail')) router.back()
  else void router.replace({ name: 'detail', query: { series_id: id.value } })
}

/* ---------- 快捷键 / 滚轮 ---------- */
useKeymap({
  ' ': player.toggle,
  ArrowUp: goPrev,
  ArrowDown: goNext,
  ArrowLeft: () => player.seekBy(-5),
  ArrowRight: () => player.seekBy(5),
  f: player.toggleFullscreen,
  e: () => (store.drawerOpen = !store.drawerOpen),
  t: () => layout.value === 'landscape' && (store.theater = !store.theater),
  m: player.toggleMute,
  Escape: () => !document.fullscreenElement && back()
})
const onWheel = useThrottleFn((e: WheelEvent) => {
  if (Math.abs(e.deltaY) < 30 || layout.value !== 'portrait') return
  if (e.deltaY > 0) goNext()
  else goPrev()
}, 700)

const subtitle = computed(() =>
  layout.value === 'portrait'
    ? episodeTitle(episode.value).replace(/^(第 \d+ 集)/, '$1 ·')
    : [series.value?.title, quality.value, '16:9 横屏片源'].join(' · ')
)
const theater = computed(() => layout.value === 'landscape' && store.theater)

const MAIN = {
  portrait: 'flex items-center justify-center px-10 pt-16 pb-8',
  landscape: 'block overflow-y-auto px-[18px] pt-12 pb-6'
}
const SWITCH_BTN =
  'grid size-9 place-items-center rounded-full transition duration-150 disabled:opacity-30'
</script>

<template>
  <div class="relative isolate flex h-full overflow-hidden">
    <img
      class="absolute -inset-15 -z-1 h-[calc(100%+120px)] w-[calc(100%+120px)] object-cover blur-[60px]"
      :class="layout === 'landscape' ? 'opacity-28' : 'opacity-45'"
      :src="coverUrl(series?.cover_url, 200)"
      alt=""
    />

    <main class="relative min-w-0 flex-1" :class="MAIN[layout]" @wheel.passive="onWheel">
      <div
        class="absolute inset-x-0 top-0 z-2 flex h-12 items-center drag"
        :class="isMac ? 'pl-22.5' : 'pl-6'"
      >
        <BackPill @back="back" />
      </div>

      <StatusBlock v-if="loadError" class="w-105" :error="loadError" @retry="load" />

      <template v-else-if="layout === 'portrait'">
        <div class="-mb-20 flex items-end gap-5 pb-20">
          <Transition :name="`ep-${direction}`" mode="out-in">
            <VideoStage
              :key="episode?.id"
              layout="portrait"
              :poster="episode?.cover_url || series?.cover_url"
              :title="series?.title ?? ''"
              :subtitle="subtitle"
              :quality="quality"
              :has-prev="!!prevEp"
              :has-next="!!nextEp"
              :error="error"
              :loading="loading || !episode"
              @prev="goPrev"
              @next="goNext"
              @quality="cycleQuality"
              @retry="resolve"
              @reset="resetDevice"
            />
          </Transition>
          <PlayerActions
            v-model:liked="liked"
            class="mb-29"
            direction="vertical"
            :likes="countText(series?.digg_count) || '点赞'"
            :followed="followed"
            @follow="toggleFollow"
            @share="share(series?.title)"
          />
        </div>
        <div class="absolute top-1/2 right-[22px] flex -translate-y-1/2 flex-col gap-3">
          <button
            :class="[SWITCH_BTN, 'bg-white/14 text-fg-1']"
            :disabled="!prevEp"
            title="上一集 ↑"
            @click="goPrev"
          >
            <AppIcon name="up" :size="20" />
          </button>
          <button
            :class="[SWITCH_BTN, 'bg-fg-1 text-black']"
            :disabled="!nextEp"
            title="下一集 ↓"
            @click="goNext"
          >
            <AppIcon name="down" :size="20" />
          </button>
        </div>
      </template>

      <div
        v-else
        class="mx-auto flex flex-col gap-5"
        :class="theater ? 'max-w-[min(100%,calc((100vh_-_72px)_*_16_/_9))]' : 'max-w-[1012px]'"
      >
        <VideoStage
          :class="{ 'max-w-none!': theater }"
          layout="landscape"
          :poster="episode?.cover_url || series?.cover_url"
          :title="episodeTitle(episode)"
          :subtitle="subtitle"
          :quality="quality"
          :has-prev="!!prevEp"
          :has-next="!!nextEp"
          :error="error"
          :loading="loading || !episode"
          @prev="goPrev"
          @next="goNext"
          @quality="cycleQuality"
          @retry="resolve"
          @reset="resetDevice"
        >
          <template #badge>
            <span
              v-if="stream"
              class="absolute top-4 left-4 rounded-6 bg-black/45 px-2.5 py-[5px] text-12 font-medium text-fg-1 transition-opacity duration-250"
              :class="{ 'opacity-0': !player.showUi }"
              >16:9 横屏 · 已自动切换宽屏布局</span
            >
          </template>
        </VideoStage>
        <template v-if="!theater">
          <PlayerInfoBar :series="series">
            <PlayerActions
              v-model:liked="liked"
              direction="horizontal"
              :likes="countText(series?.digg_count) || '点赞'"
              :followed="followed"
              @follow="toggleFollow"
              @share="share(series?.title)"
            />
          </PlayerInfoBar>
          <LandscapeMoreRow :items="related" />
        </template>
      </div>
    </main>

    <Transition name="drawer">
      <EpisodeDrawer
        v-if="store.drawerOpen && !theater"
        :series="series"
        :episodes="episodes"
        :current="epNo"
        :next="nextEp"
        :countdown="autoNext.countdown.value"
        :related="related"
        @pick="(ep) => go(ep.number)"
        @cancel-countdown="autoNext.cancel"
      />
    </Transition>
  </div>
</template>
