<script setup lang="ts">
import { storeToRefs } from 'pinia'
import ContinueCard from '@renderer/components/drama/ContinueCard.vue'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import BaseButton from '@renderer/components/ui/BaseButton.vue'
import StatusBlock from '@renderer/components/ui/StatusBlock.vue'
import { useHistoryStore } from '@renderer/stores/history'

const historyStore = useHistoryStore()
const { list } = storeToRefs(historyStore)

const dayOf = (t: number): string => {
  const d = new Date(t)
  const today = new Date().setHours(0, 0, 0, 0)
  if (t >= today) return '今天'
  if (t >= today - 86_400_000) return '昨天'
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日`
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex items-end justify-between">
      <div>
        <h1 class="text-28 font-bold text-fg-1">观看历史</h1>
        <p class="mt-1.5 text-13 text-fg-4b">仅保存在本机 · 共 {{ list.length }} 部</p>
      </div>
      <BaseButton
        v-if="list.length"
        variant="ghost"
        size="sm"
        icon="trash"
        @click="historyStore.clear"
      >
        清空历史
      </BaseButton>
    </header>

    <StatusBlock v-if="!list.length" empty="还没有观看记录，去首页挑一部吧">
      <RouterLink to="/" class="more-link">去首页 →</RouterLink>
    </StatusBlock>

    <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-x-4 gap-y-9 pt-5">
      <div v-for="(r, i) in list" :key="r.seriesId" class="group/item relative">
        <span
          v-if="i === 0 || dayOf(r.updatedAt) !== dayOf(list[i - 1].updatedAt)"
          class="absolute -top-5 left-0.5 text-12 text-fg-5"
        >
          {{ dayOf(r.updatedAt) }}
        </span>
        <ContinueCard :record="r" />
        <button
          class="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-white/10 text-fg-3 opacity-0 transition-opacity duration-150 group-hover/item:opacity-100 hover:bg-brand hover:text-fg-1"
          title="删除"
          @click="historyStore.remove(r.seriesId)"
        >
          <AppIcon name="close" :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>
