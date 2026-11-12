<script setup lang="ts">
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import { useNav } from '@renderer/composables/useNav'
import { coverUrl } from '@renderer/services/format'
import type { HistoryRecord } from '@renderer/stores/history'

const { record } = defineProps<{ record: HistoryRecord }>()
const { play } = useNav()
</script>

<template>
  <article
    class="group/continue flex h-[108px] min-w-0 cursor-pointer items-center gap-3.5 rounded-14 bg-card-soft p-2.5 transition-colors duration-150 hover:bg-card-2"
    @click="play(record.seriesId, record.epNumber)"
  >
    <img
      class="h-[88px] w-16 flex-none rounded-8 bg-card object-cover"
      :src="coverUrl(record.cover, 200)"
      :alt="record.title"
      loading="lazy"
    />
    <div class="flex min-w-0 flex-1 flex-col gap-1.5">
      <h3 class="truncate text-14 font-medium text-fg-2">{{ record.title }}</h3>
      <p class="text-12 text-fg-4b">
        看到第 {{ record.epNumber }} 集
        <template v-if="record.totalEp > record.epNumber">
          · 剩余 {{ record.totalEp - record.epNumber }} 集
        </template>
      </p>
      <div class="h-1 overflow-hidden rounded-[2px] bg-track">
        <i
          class="block h-full bg-brand"
          :style="{ width: `${Math.min(100, (record.epNumber / (record.totalEp || 1)) * 100)}%` }"
        />
      </div>
    </div>
    <span
      class="grid size-9 flex-none place-items-center rounded-full bg-brand pl-0.5 text-fg-1 transition-transform duration-150 group-hover/continue:scale-108"
    >
      <AppIcon name="play" :size="16" />
    </span>
  </article>
</template>
