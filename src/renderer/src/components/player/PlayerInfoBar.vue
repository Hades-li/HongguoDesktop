<script setup lang="ts">
import { computed } from 'vue'
import type { Series } from 'openhongguo'
import { episodesText, heatText, kindOf, tagsOf } from '@renderer/services/format'

/** 横屏专用：画面下方的剧名 + 标签行，右侧插槽放横排 ActionRail */
const { series } = defineProps<{ series?: Series }>()

const meta = computed(() =>
  [kindOf(series), tagsOf(series).join(' / '), heatText(series?.heat), episodesText(series)]
    .filter(Boolean)
    .join(' · ')
)
</script>

<template>
  <section class="flex items-center gap-6">
    <div class="flex min-w-0 flex-1 flex-col gap-2">
      <h2 class="truncate text-24 font-bold text-fg-1">{{ series?.title }}</h2>
      <p class="flex items-center gap-2 text-13 text-fg-3c">
        <span class="flex-none rounded-4 bg-brand/18 px-2 py-[3px] text-12 text-brand">热播</span>
        <span class="truncate">{{ meta }}</span>
      </p>
    </div>
    <slot />
  </section>
</template>
