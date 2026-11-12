<script setup lang="ts">
import { inject, useTemplateRef, watchEffect } from 'vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import { PLAYER_KEY } from '@renderer/composables/useVideoPlayer'
import { errorText } from '@renderer/services/api'
import { coverUrl } from '@renderer/services/format'
import type { PlayerLayout } from '@renderer/services/stream'
import PlayerControls from './PlayerControls.vue'

const { layout, poster, error, loading } = defineProps<{
  layout: PlayerLayout
  poster?: string
  title: string
  subtitle: string
  quality: string
  hasPrev: boolean
  hasNext: boolean
  error?: unknown
  loading?: boolean
}>()
const emit = defineEmits<{ prev: []; next: []; quality: []; retry: []; reset: [] }>()

const player = inject(PLAYER_KEY)!
const frame = useTemplateRef('frame')
const video = useTemplateRef('video')
watchEffect(() => {
  player.frame = frame.value
  player.el = video.value
})

/** 单击播放 / 暂停，双击全屏：单击延迟执行，双击时取消 */
let clickTimer: ReturnType<typeof setTimeout> | undefined
function onClick(): void {
  clearTimeout(clickTimer)
  clickTimer = setTimeout(player.toggle, 220)
}
function onDblclick(): void {
  clearTimeout(clickTimer)
  void player.toggleFullscreen()
}

const LAYOUTS = {
  portrait: {
    frame: 'aspect-452/804 h-[min(804px,calc(100vh-96px))] rounded-16',
    bottom: 'px-5 pt-20 pb-3.5',
    caption: 'max-w-[360px]',
    title: 'text-16'
  },
  landscape: {
    frame: 'aspect-video w-full max-w-[1012px] rounded-12',
    bottom: 'px-6 pt-[120px] pb-4',
    caption: 'max-w-[600px]',
    title: 'text-18'
  }
}
const CENTER = 'absolute top-[45%] left-1/2 -translate-1/2'
</script>

<template>
  <div
    ref="frame"
    class="relative overflow-hidden bg-black shadow-video [&:fullscreen]:size-full [&:fullscreen]:max-w-none [&:fullscreen]:rounded-none"
    :class="[LAYOUTS[layout].frame, player.showUi ? 'cursor-pointer' : 'cursor-none']"
    @click="onClick"
    @dblclick="onDblclick"
  >
    <img
      v-if="poster && !player.ready"
      class="absolute inset-0 size-full object-cover blur-[2px] brightness-60"
      :src="coverUrl(poster, 720)"
      alt=""
    />
    <video ref="video" class="absolute inset-0 size-full object-contain" playsinline />

    <div
      v-if="error || player.mediaError"
      class="flex w-4/5 cursor-default flex-col items-center gap-3.5 rounded-14 bg-black/60 p-6 text-center text-14 text-fg-2b backdrop-blur-md"
      :class="CENTER"
      @click.stop
    >
      <AppIcon name="close" :size="28" />
      <p>{{ player.mediaError ?? errorText(error) }}</p>
      <div class="flex flex-wrap justify-center gap-2">
        <BaseButton size="sm" icon="refresh" @click="emit('retry')">重试</BaseButton>
        <BaseButton size="sm" variant="glass" @click="emit('reset')">换个设备重试</BaseButton>
        <BaseButton v-if="hasNext" size="sm" variant="glass" icon="next" @click="emit('next')">
          下一集
        </BaseButton>
      </div>
    </div>
    <div
      v-else-if="loading || player.waiting"
      class="size-[42px] animate-spin rounded-full border-3 border-white/25 border-t-brand"
      :class="CENTER"
    />
    <button
      v-else-if="player.ready && !player.playing"
      class="grid size-[68px] place-items-center rounded-full bg-black/45 pl-1 text-fg-1 backdrop-blur-sm"
      :class="CENTER"
      @click.stop="player.toggle"
    >
      <AppIcon name="play" :size="32" />
    </button>

    <slot name="badge" />

    <div
      class="absolute inset-x-0 bottom-0 flex cursor-default flex-col gap-3.5 bg-linear-[transparent,rgba(0,0,0,0.85)] transition-opacity duration-250"
      :class="[LAYOUTS[layout].bottom, { 'opacity-0': !player.showUi }]"
    >
      <div class="flex flex-col gap-1.5" :class="LAYOUTS[layout].caption">
        <h2 class="truncate font-bold text-fg-1" :class="LAYOUTS[layout].title">{{ title }}</h2>
        <p class="truncate text-13 text-fg-2c">{{ subtitle }}</p>
      </div>
      <PlayerControls
        :layout="layout"
        :quality="quality"
        :has-prev="hasPrev"
        :has-next="hasNext"
        @prev="emit('prev')"
        @next="emit('next')"
        @quality="emit('quality')"
      />
    </div>
  </div>
</template>
