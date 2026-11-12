<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import PagedGrid from '@renderer/components/drama/PagedGrid.vue'
import { usePaged } from '@renderer/composables/usePaged'
import { call } from '@renderer/services/api'
import { useSeriesStore } from '@renderer/stores/series'

const route = useRoute()
const seriesStore = useSeriesStore()
const q = computed(() => String(route.query.q ?? '').trim())

/** search() 结果不带封面，靠 getSeriesBatch 补齐 */
const { items, loading, error, hasMore, load, reset, retry } = usePaged(async (cursor) => {
  const page = await call('search', q.value, { cursor, pageSize: 18 })
  await seriesStore.prefetch(page.items.map((i) => i.id))
  return page
})

const list = computed(() =>
  items.value.map((it) => ({
    ...it,
    cover_url: it.cover_url ?? seriesStore.series.get(it.id)?.cover_url
  }))
)

watch(q, (v) => v && reset(), { immediate: true })
</script>

<template>
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="text-28 font-bold text-fg-1">
        搜索 <em class="text-brand-soft not-italic">“{{ q }}”</em>
      </h1>
      <p v-if="items.length" class="mt-1.5 text-13 text-fg-4b">找到以下相关短剧</p>
    </header>
    <PagedGrid
      :items="list"
      :loading="loading"
      :error="error"
      :has-more="hasMore"
      :empty="`没有找到与“${q}”相关的短剧，换个关键词试试`"
      @more="load"
      @retry="retry"
    />
  </div>
</template>
