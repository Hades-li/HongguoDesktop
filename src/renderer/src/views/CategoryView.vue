<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FilterRow } from 'openhongguo'
import FilterRows from '@renderer/components/category/FilterRows.vue'
import PagedGrid from '@renderer/components/drama/PagedGrid.vue'
import { usePaged } from '@renderer/composables/usePaged'
import { call } from '@renderer/services/api'
import { useSeriesStore } from '@renderer/stores/series'
import { GENRES, type GenreKey } from '@shared/constants'

const route = useRoute()
const router = useRouter()
const seriesStore = useSeriesStore()

/** 体裁走 URL（侧栏 真人剧 / 漫剧 / AI 剧 直达），其余筛选为页面内状态 */
const genreKey = computed(() =>
  (route.query.genre as string) in GENRES ? (route.query.genre as GenreKey) : undefined
)
const genre = computed(() => genreKey.value && GENRES[genreKey.value].genre)
const rows = shallowRef<FilterRow[]>([])
const picked = ref<Record<string, string>>({})

const model = computed({
  get: () => ({ ...picked.value, genre: genre.value ?? '' }),
  set: (v: Record<string, string>) => {
    const { genre: g, ...rest } = v
    if (g !== (genre.value ?? '')) {
      const key = Object.entries(GENRES).find(([, x]) => x.genre === g)?.[0]
      picked.value = {}
      void router.replace({ query: key ? { genre: key } : {} })
    } else picked.value = rest
  }
})

const selections = computed(() =>
  Object.fromEntries(
    Object.entries(model.value)
      .filter(([, v]) => v)
      .map(([k, v]) => [k, [v]])
  )
)

const { items, loading, error, hasMore, load, reset, retry } = usePaged(async (cursor) => {
  const page = await call('shortFilter', { selections: selections.value, cursor })
  void seriesStore.prefetch(page.items.map((i) => i.id))
  return page
})

watch(
  genre,
  async (g) => {
    rows.value = await call('shortFilterPanel', g).catch(() => rows.value)
  },
  { immediate: true }
)
watch(selections, reset, { immediate: true, deep: true })

const title = computed(() => (genreKey.value ? GENRES[genreKey.value].label : '分类找剧'))
</script>

<template>
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="text-28 font-bold text-fg-1">{{ title }}</h1>
      <p class="mt-1.5 text-13 text-fg-4b">按体裁、题材、设定、背景筛选，找到想看的剧</p>
    </header>
    <FilterRows v-if="rows.length" v-model="model" :rows="rows" />
    <div v-else class="h-65 skeleton rounded-16" />
    <PagedGrid
      :items="items"
      :loading="loading"
      :error="error"
      :has-more="hasMore"
      empty="没有符合条件的短剧，换个筛选试试"
      @more="load"
      @retry="retry"
    />
  </div>
</template>
