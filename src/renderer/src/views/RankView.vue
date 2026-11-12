<script setup lang="ts">
import { computed, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RankPodiumCard from '@renderer/components/rank/RankPodiumCard.vue'
import RankRow from '@renderer/components/rank/RankRow.vue'
import SegmentControl from '@renderer/components/ui/SegmentControl.vue'
import StatusBlock from '@renderer/components/ui/StatusBlock.vue'
import UnderlineTabs from '@renderer/components/ui/UnderlineTabs.vue'
import { useInfiniteScroll } from '@renderer/composables/useInfiniteScroll'
import { useRankStore } from '@renderer/stores/rank'
import { useSeriesStore } from '@renderer/stores/series'
import { RANK_BOARDS, RANK_TYPES, type RankBoardKey, type RankType } from '@shared/constants'

const { type } = defineProps<{ type: RankType }>()

const route = useRoute()
const router = useRouter()
const rankStore = useRankStore()
const seriesStore = useSeriesStore()

const PLACES = [1, 2, 3] as const
const TITLES = { hot: '热播排行榜', rec: '推荐排行榜', new: '新剧排行榜' }
const SUBTITLES = { hot: '按全站播放热度排序', rec: '按综合推荐热度排序', new: '近期上线新剧' }

const typeOptions = Object.entries(RANK_TYPES).map(([value, t]) => ({
  value: value as RankType,
  label: t.label
}))

const typeModel = computed({
  get: () => type,
  set: (t: RankType) => router.replace({ params: { type: t }, query: route.query })
})

const board = computed({
  get: () =>
    (RANK_BOARDS.some((b) => b.value === route.query.board)
      ? route.query.board
      : 'hot') as RankBoardKey,
  set: (b: RankBoardKey) => router.replace({ query: { board: b } })
})

const page = computed(() => rankStore.pages.get(rankStore.keyOf(type, board.value)))
const items = computed(() => page.value?.items ?? [])
const loadMore = (): void => void rankStore.load(type, board.value, true)

watch([() => type, board], ([t, b]) => rankStore.load(t, b), { immediate: true })
watch(items, (list) => seriesStore.prefetch(list.slice(0, 30).map((i) => i.series_id!)))

const updatedAt = computed(() => {
  const t = page.value?.fetchedAt
  return t ? new Date(t).toTimeString().slice(0, 5) : '--:--'
})

useInfiniteScroll(useTemplateRef('sentinel'), loadMore)
</script>

<template>
  <div class="flex flex-col gap-7">
    <header class="-mb-1 flex items-end justify-between">
      <div>
        <h1 class="text-32 leading-[1.3] font-bold text-fg-1">{{ TITLES[board] }}</h1>
        <p class="mt-1.5 text-13 text-fg-4b">
          每小时更新 · {{ SUBTITLES[board] }} · 更新于 {{ updatedAt }}
        </p>
      </div>
      <SegmentControl v-model="board" :options="RANK_BOARDS" />
    </header>

    <UnderlineTabs v-model="typeModel" :options="typeOptions" />

    <template v-if="items.length">
      <section class="grid grid-cols-[repeat(3,1fr)] gap-5">
        <RankPodiumCard
          v-for="(it, i) in items.slice(0, 3)"
          :key="it.series_id"
          :item="it"
          :place="PLACES[i]"
        />
      </section>
      <section v-if="items.length > 3" class="flex flex-col gap-0.5 rounded-16 bg-[#141418] p-2">
        <RankRow v-for="it in items.slice(3)" :key="it.series_id" :item="it" />
      </section>
    </template>
    <div v-else-if="page?.loading || !page" class="grid grid-cols-[repeat(3,1fr)] gap-5">
      <div v-for="i in 3" :key="i" class="h-56 skeleton rounded-16" />
    </div>
    <StatusBlock
      v-else
      :error="page.error"
      empty="榜单暂无数据"
      @retry="rankStore.load(type, board)"
    />

    <p ref="sentinel" class="text-center text-13 text-fg-5">
      <template v-if="page?.loading && items.length">加载中…</template>
      <template v-else-if="page?.hasMore"
        >下滑加载 {{ items.length + 1 }}–{{ items.length + 10 }} 名</template
      >
      <template v-else-if="items.length">已经到底了</template>
    </p>
  </div>
</template>
