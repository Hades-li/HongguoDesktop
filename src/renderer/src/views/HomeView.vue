<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import ContinueCard from '@renderer/components/drama/ContinueCard.vue'
import DramaGrid from '@renderer/components/drama/DramaGrid.vue'
import HeroCarousel from '@renderer/components/drama/HeroCarousel.vue'
import SectionHeader from '@renderer/components/drama/SectionHeader.vue'
import RankTop5Item from '@renderer/components/rank/RankTop5Item.vue'
import FilterTabs from '@renderer/components/ui/FilterTabs.vue'
import StatusBlock from '@renderer/components/ui/StatusBlock.vue'
import { useHistoryStore } from '@renderer/stores/history'
import { useHomeStore, type HotTab } from '@renderer/stores/home'
import { useRankStore } from '@renderer/stores/rank'
import { useSeriesStore } from '@renderer/stores/series'

const homeStore = useHomeStore()
const rankStore = useRankStore()
const seriesStore = useSeriesStore()
const { list: history } = storeToRefs(useHistoryStore())

const tabs: { value: HotTab; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'real', label: '真人剧' },
  { value: 'comic', label: '漫剧' },
  { value: 'ai', label: 'AI 剧' }
]
const tab = ref<HotTab>('all')
const hot = computed(() => homeStore.hot.get(tab.value))

const hotRank = computed(() => rankStore.pages.get(rankStore.keyOf('hot-drama', 'hot')))
const recRank = computed(() => rankStore.pages.get(rankStore.keyOf('hot-drama', 'rec')))
const heroItems = computed(() => hotRank.value?.items.slice(0, 5) ?? [])
const top5 = computed(() => recRank.value?.items.slice(0, 5) ?? [])

watch(tab, homeStore.loadHot, { immediate: true })
void rankStore.load('hot-drama', 'hot')
void rankStore.load('hot-drama', 'rec')
watch(heroItems, (items) => seriesStore.prefetch(items.map((i) => i.series_id!)))
</script>

<template>
  <div class="flex flex-col gap-9">
    <HeroCarousel :items="heroItems" />
    <StatusBlock
      v-if="hotRank?.error && !heroItems.length"
      :error="hotRank.error"
      @retry="rankStore.load('hot-drama', 'hot')"
    />

    <section v-if="history.length">
      <SectionHeader title="继续观看" more="观看历史" :to="{ name: 'history' }" />
      <div class="grid grid-cols-[repeat(3,1fr)] gap-4">
        <ContinueCard v-for="r in history.slice(0, 3)" :key="r.seriesId" :record="r" />
      </div>
    </section>

    <section>
      <SectionHeader
        title="热播短剧"
        more="查看全部"
        :to="{ name: 'category', query: tab === 'all' ? {} : { genre: tab } }"
      >
        <FilterTabs v-model="tab" :options="tabs" />
      </SectionHeader>
      <StatusBlock v-if="hot?.error" :error="hot.error" @retry="homeStore.loadHot(tab)" />
      <DramaGrid
        v-else
        class="[--drama-cols:repeat(6,1fr)]"
        :items="hot?.items.slice(0, 6) ?? []"
        :loading="!hot || (hot.loading && !hot.items.length)"
      />
    </section>

    <section>
      <SectionHeader
        title="本周热度榜 TOP 5"
        more="完整榜单"
        :to="{ path: '/rank/hot-drama', query: { board: 'rec' } }"
      />
      <div class="grid grid-cols-[repeat(5,1fr)] gap-4">
        <RankTop5Item v-for="(it, i) in top5" :key="it.series_id" :item="it" :place="i + 1" />
        <template v-if="!top5.length">
          <div v-for="i in 5" :key="i" class="h-[210px] skeleton" />
        </template>
      </div>
    </section>
  </div>
</template>
