<script setup lang="ts">
import { inject } from 'vue'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import { PLAYER_KEY } from '@renderer/composables/useVideoPlayer'
import { clock } from '@renderer/services/format'
import type { PlayerLayout } from '@renderer/services/stream'
import { usePlayerStore } from '@renderer/stores/player'
import ProgressBar from './ProgressBar.vue'

const { layout, quality, hasPrev, hasNext } = defineProps<{
  layout: PlayerLayout
  quality: string
  hasPrev: boolean
  hasNext: boolean
}>()
const emit = defineEmits<{ prev: []; next: []; quality: [] }>()

const player = inject(PLAYER_KEY)!
const store = usePlayerStore()
const rateText = (r: number): string => `${Number.isInteger(r * 10) ? r.toFixed(1) : r}x`

const BTN =
  'grid place-items-center text-fg-1 opacity-92 transition-opacity duration-150 hover:opacity-100 disabled:opacity-35'
const TEXT = `${BTN} text-12 font-semibold`
</script>

<template>
  <div class="flex flex-col gap-1" @click.stop @dblclick.stop>
    <ProgressBar :current="player.current" :duration="player.duration" @seek="player.seek" />
    <div class="flex h-7 items-center" :class="layout === 'landscape' ? 'gap-5' : 'gap-4'">
      <button
        v-if="layout === 'landscape'"
        :class="BTN"
        :disabled="!hasPrev"
        title="上一集 ↑"
        @click="emit('prev')"
      >
        <AppIcon name="prev" :size="20" />
      </button>
      <button
        :class="BTN"
        :title="player.playing ? '暂停 空格' : '播放 空格'"
        @click="player.toggle"
      >
        <AppIcon :name="player.playing ? 'pause' : 'play'" :size="20" />
      </button>
      <button :class="BTN" :disabled="!hasNext" title="下一集 ↓" @click="emit('next')">
        <AppIcon name="next" :size="20" />
      </button>
      <span class="flex-1 font-num text-12 font-medium text-fg-2c">
        {{ clock(player.current) }} / {{ clock(player.duration) }}
      </span>
      <button :class="TEXT" title="倍速" @click="store.cycleRate">
        {{ rateText(store.rate) }}
      </button>
      <button
        v-if="layout === 'landscape'"
        :class="[
          BTN,
          'rounded-4 border px-2 py-[3px] text-12 font-medium',
          store.theater ? 'border-brand bg-brand' : 'border-white/35'
        ]"
        title="影院模式 T"
        @click="store.theater = !store.theater"
      >
        影院模式
      </button>
      <button :class="TEXT" title="清晰度" @click="emit('quality')">{{ quality }}</button>
      <button
        :class="BTN"
        :title="player.isFullscreen ? '退出全屏 F' : '全屏 F'"
        @click="player.toggleFullscreen"
      >
        <AppIcon :name="player.isFullscreen ? 'exit-fullscreen' : 'fullscreen'" :size="18" />
      </button>
    </div>
  </div>
</template>
