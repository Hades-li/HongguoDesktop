<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import StatusBlock from '@renderer/components/ui/StatusBlock.vue'
import { useNav } from '@renderer/composables/useNav'
import { coverUrl } from '@renderer/services/format'
import { useFollowStore } from '@renderer/stores/follow'
import { useHistoryStore } from '@renderer/stores/history'

const followStore = useFollowStore()
const historyStore = useHistoryStore()
const { list } = storeToRefs(followStore)
const { openDetail, play } = useNav()

onMounted(followStore.refresh)

const seenOf = (id: string): number => historyStore.records[id]?.epNumber ?? 0
</script>

<template>
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="text-28 font-bold text-fg-1">我的追剧</h1>
      <p class="mt-1.5 text-13 text-fg-4b">
        仅保存在本机 · 共 {{ list.length }} 部 · {{ followStore.updateCount }} 部有更新
      </p>
    </header>

    <StatusBlock v-if="!list.length" empty="还没有追剧，在详情页或播放页点「追剧」即可加入">
      <RouterLink to="/rank" class="more-link">去排行榜看看 →</RouterLink>
    </StatusBlock>

    <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-x-4 gap-y-6">
      <article
        v-for="f in list"
        :key="f.seriesId"
        class="group relative flex min-w-0 cursor-pointer flex-col gap-1.5"
        @click="openDetail(f.seriesId)"
      >
        <div class="relative aspect-172/240 overflow-hidden rounded-10 bg-card">
          <img
            class="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            :src="coverUrl(f.cover)"
            :alt="f.title"
            loading="lazy"
          />
          <span
            v-if="f.totalEp > f.seenEp"
            class="absolute top-2 left-2 rounded-10 bg-brand px-[7px] py-px text-10 text-fg-1"
          >
            更新 {{ f.totalEp - f.seenEp }} 集
          </span>
          <button
            class="absolute right-2 bottom-2 grid size-10 scale-80 place-items-center rounded-full bg-brand pl-[3px] text-fg-1 opacity-0 transition-[opacity,scale] duration-200 ease-out group-hover:scale-100 group-hover:opacity-100"
            title="继续看"
            @click.stop="
              (followStore.markSeen(f.seriesId), play(f.seriesId, seenOf(f.seriesId) || undefined))
            "
          >
            <AppIcon name="play" :size="20" />
          </button>
        </div>
        <h3 class="mt-0.5 truncate text-14 font-medium text-fg-2">{{ f.title }}</h3>
        <p class="text-12 text-fg-4b">
          {{ seenOf(f.seriesId) ? `看到第 ${seenOf(f.seriesId)} 集` : '还没开始看' }}
          <template v-if="f.totalEp"> · 共 {{ f.totalEp }} 集</template>
        </p>
        <button
          class="self-start text-12 text-fg-5 hover:text-brand-soft"
          @click.stop="followStore.toggle(f)"
        >
          取消追剧
        </button>
      </article>
    </div>
  </div>
</template>
