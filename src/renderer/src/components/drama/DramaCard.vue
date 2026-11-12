<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import { useNav } from '@renderer/composables/useNav'
import { coverUrl, episodesText, tagsOf, type DramaItem } from '@renderer/services/format'
import { useSeriesStore } from '@renderer/stores/series'

const { item } = defineProps<{ item: DramaItem }>()

const { openDetail } = useNav()
const seriesStore = useSeriesStore()
const detail = computed(() => seriesStore.series.get(item.id))
const badge = computed(() => episodesText(detail.value ?? item))
const tags = computed(() => tagsOf(detail.value).join(' · '))
</script>

<template>
  <article
    class="group flex min-w-0 cursor-pointer flex-col gap-2 transition-transform duration-200 ease-out hover:-translate-y-1"
    @click="openDetail(item.id)"
  >
    <div
      class="relative aspect-172/240 overflow-hidden rounded-10 bg-card after:absolute after:inset-x-0 after:bottom-0 after:h-[90px] after:bg-linear-to-b after:from-transparent after:to-black/75"
    >
      <img
        class="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        :src="coverUrl(item.cover_url)"
        :alt="item.title"
        loading="lazy"
      />
      <span v-if="badge" class="absolute bottom-2 left-2 z-1 text-11 font-medium text-fg-1">
        {{ badge }}
      </span>
      <span
        class="absolute top-1/2 left-1/2 z-1 grid size-12 -translate-1/2 scale-80 place-items-center rounded-full bg-brand/90 pl-[3px] text-fg-1 opacity-0 transition duration-200 ease-out group-hover:scale-100 group-hover:opacity-100"
      >
        <AppIcon name="play" :size="20" />
      </span>
    </div>
    <h3 class="truncate text-14 font-medium text-fg-2" :title="item.title">{{ item.title }}</h3>
    <p class="-mt-1 truncate text-12 text-fg-4b">{{ tags || '&nbsp;' }}</p>
  </article>
</template>
