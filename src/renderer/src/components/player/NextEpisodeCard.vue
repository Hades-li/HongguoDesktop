<script setup lang="ts">
import type { Episode } from 'openhongguo'
import { coverUrl } from '@renderer/services/format'

/** 下一集预告；countdown 有值时显示倒计时条（单集播完后 5s 自动连播） */
const {
  episode,
  countdown,
  total = 5
} = defineProps<{
  episode: Episode
  countdown?: number
  total?: number
}>()
const emit = defineEmits<{ play: []; cancel: [] }>()

const THUMB = 'h-[72px] w-32 flex-none rounded-8 bg-tile object-cover'
</script>

<template>
  <section
    class="flex cursor-pointer flex-col gap-3 rounded-12 bg-card p-3.5 transition-colors duration-150 hover:bg-card-2"
    @click="emit('play')"
  >
    <header class="flex justify-between text-13 text-fg-1">
      <b>下一集预告</b>
      <span
        v-if="countdown !== undefined"
        class="text-12 text-brand-soft"
        @click.stop="emit('cancel')"
      >
        {{ Math.ceil(countdown) }}s 后自动播放 · 取消
      </span>
    </header>
    <div class="flex gap-3">
      <img v-if="episode.cover_url" :class="THUMB" :src="coverUrl(episode.cover_url, 256)" alt="" />
      <div v-else :class="THUMB" />
      <div class="flex min-w-0 flex-col justify-center gap-1.5">
        <h4 class="text-14 font-medium text-fg-1">第{{ episode.number }}集</h4>
        <p class="line-clamp-2 text-12 text-fg-4b">{{ episode.title || '点击立即播放' }}</p>
      </div>
    </div>
    <div v-if="countdown !== undefined" class="h-[3px] overflow-hidden rounded-[2px] bg-[#2a2a32]">
      <i
        class="block h-full bg-brand transition-[width] duration-100 ease-linear"
        :style="{ width: `${(1 - countdown / total) * 100}%` }"
      />
    </div>
  </section>
</template>
