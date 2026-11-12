<script setup lang="ts">
import { useNav } from '@renderer/composables/useNav'
import { coverUrl, type DramaItem } from '@renderer/services/format'

const { items } = defineProps<{ items: DramaItem[] }>()
const { openDetail, play } = useNav()
</script>

<template>
  <section v-if="items.length" class="flex flex-col gap-3">
    <header class="flex items-center justify-between">
      <h3 class="text-15 font-bold text-fg-1">更多横屏好剧</h3>
      <RouterLink :to="{ name: 'category' }" class="text-12 text-[#9999a3] hover:text-fg-1">
        查看全部 →
      </RouterLink>
    </header>
    <div class="grid grid-cols-[repeat(4,1fr)] gap-3">
      <article
        v-for="it in items.slice(0, 4)"
        :key="it.id"
        class="group/card relative flex h-[108px] cursor-pointer items-end overflow-hidden rounded-8 px-2.5 pt-2.5 pb-2 after:absolute after:inset-0 after:bg-linear-[transparent_40%,rgba(0,0,0,0.8)]"
        @click="play(it.id)"
        @contextmenu.prevent="openDetail(it.id)"
      >
        <img
          class="absolute inset-0 size-full object-cover object-[center_30%] transition-transform duration-300 ease-out group-hover/card:scale-105"
          :src="coverUrl(it.cover_url, 480)"
          :alt="it.title"
          loading="lazy"
        />
        <h4 class="relative z-1 truncate text-13 font-medium text-fg-1">{{ it.title }}</h4>
      </article>
    </div>
  </section>
</template>
