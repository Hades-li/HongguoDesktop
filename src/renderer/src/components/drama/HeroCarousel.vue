<script setup lang="ts">
import { computed } from 'vue'
import type { RankItem } from 'openhongguo'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import { useCarousel } from '@renderer/composables/useCarousel'
import { useFollowToggle } from '@renderer/composables/useFollowToggle'
import { useKeymap } from '@renderer/composables/useHotkeys'
import { useNav } from '@renderer/composables/useNav'
import {
  coverUrl,
  episodesText,
  fromRank,
  heatText,
  kindOf,
  tagsOf
} from '@renderer/services/format'
import { useSeriesStore } from '@renderer/stores/series'

const { items } = defineProps<{ items: RankItem[] }>()

const { openDetail, play } = useNav()
const seriesStore = useSeriesStore()
const { index, direction, hovering, go, next, prev } = useCarousel(computed(() => items.length))

const cur = computed(() => items[index.value])
const detail = computed(() => seriesStore.series.get(cur.value?.series_id ?? ''))
const meta = computed(() =>
  [
    detail.value?.heat ? heatText(detail.value.heat) : cur.value?.score,
    episodesText(detail.value ?? cur.value),
    kindOf(detail.value),
    tagsOf(detail.value).join(' / ')
  ].filter(Boolean)
)
const { followed, toggle: toggleFollow } = useFollowToggle(
  () => detail.value ?? (cur.value && fromRank(cur.value))
)

useKeymap({ ArrowLeft: prev, ArrowRight: next })

const THUMB = {
  on: 'h-[148px] w-[104px] opacity-100 shadow-[0_8px_20px_rgba(0,0,0,0.5)] outline-2 -outline-offset-2 outline-fg-1',
  off: 'h-[120px] w-[84px] opacity-75 hover:opacity-100'
}
const DOT = { on: 'w-6 bg-brand', off: 'w-2 bg-white/35' }
</script>

<template>
  <section
    v-if="cur"
    class="relative h-[440px] overflow-hidden rounded-20 bg-card"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
    @wheel.passive="(e) => Math.abs(e.deltaX) > 30 && (e.deltaX > 0 ? next() : prev())"
  >
    <!-- 封面是竖版海报：整体铺一层模糊氛围色，清晰海报靠右展示 -->
    <img
      class="absolute -inset-10 h-[calc(100%+80px)] w-[calc(100%+80px)] object-cover [filter:blur(40px)_saturate(1.2)_brightness(0.6)]"
      :src="coverUrl(cur.cover_url, 200)"
      alt=""
    />
    <Transition :name="`slide-${direction}`">
      <img
        :key="cur.series_id"
        class="absolute top-0 right-0 h-full w-[62%] mask-[linear-gradient(90deg,transparent,#000_35%)] object-cover object-[center_30%]"
        :src="coverUrl(cur.cover_url, 720)"
        alt=""
      />
    </Transition>
    <div
      class="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,13,18,0.95)_0%,rgba(13,13,18,0.6)_45%,rgba(13,13,18,0)_75%),linear-gradient(transparent_calc(100%-180px),rgba(13,13,18,0.85))]"
    />

    <Transition name="fade" mode="out-in">
      <div
        :key="cur.series_id"
        class="absolute top-16 left-12 flex w-[480px] flex-col items-start gap-4"
      >
        <span class="rounded-6 bg-brand px-2.5 py-1 text-12 font-bold text-fg-1">
          🔥 热播榜 NO.{{ index + 1 }}
        </span>
        <h1
          class="line-clamp-2 cursor-pointer text-44 leading-[1.2] font-black text-fg-1"
          @click="openDetail(cur.series_id!)"
        >
          {{ cur.title }}
        </h1>
        <p class="text-13 font-medium text-fg-2c">
          <template v-for="(m, i) in meta" :key="i">
            <span v-if="i" class="mx-2">·</span>{{ m }}
          </template>
        </p>
        <p class="line-clamp-2 min-h-[42px] text-14 text-fg-3b">{{ detail?.description }}</p>
        <div class="mt-2 flex gap-3">
          <BaseButton icon="play" @click="play(cur.series_id!)">立即播放</BaseButton>
          <BaseButton variant="glass" :icon="followed ? 'check' : 'plus'" @click="toggleFollow">
            {{ followed ? '已追剧' : '追剧' }}
          </BaseButton>
        </div>
      </div>
    </Transition>

    <div class="absolute right-0 bottom-7 flex w-[360px] flex-col gap-2.5">
      <p class="text-12 text-fg-2c">滑动查看更多短剧 ← →</p>
      <div class="flex items-center gap-3 overflow-hidden">
        <img
          v-for="(it, i) in items"
          :key="it.series_id"
          class="flex-none cursor-pointer rounded-10 object-cover transition-all duration-250 ease-out"
          :class="i === index ? THUMB.on : THUMB.off"
          :src="coverUrl(it.cover_url, 200)"
          :alt="it.title"
          @click="go(i)"
        />
      </div>
    </div>

    <div class="absolute bottom-7 left-12 flex gap-1.5">
      <i
        v-for="(it, i) in items"
        :key="it.series_id"
        class="h-1 cursor-pointer rounded-[2px] transition-all duration-250"
        :class="i === index ? DOT.on : DOT.off"
        @click="go(i)"
      />
    </div>
  </section>
  <div v-else class="h-[440px] skeleton rounded-20" />
</template>
