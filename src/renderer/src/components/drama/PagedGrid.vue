<script setup lang="ts">
import { useTemplateRef } from 'vue'
import StatusBlock from '@renderer/components/ui/StatusBlock.vue'
import { useInfiniteScroll } from '@renderer/composables/useInfiniteScroll'
import type { DramaItem } from '@renderer/services/format'
import DramaGrid from './DramaGrid.vue'

/** 无限滚动剧集网格：配合 usePaged 使用 */
const {
  items,
  loading,
  error,
  hasMore,
  empty = '暂无内容'
} = defineProps<{
  items: DramaItem[]
  loading: boolean
  error?: unknown
  hasMore: boolean
  empty?: string
}>()
const emit = defineEmits<{ more: []; retry: [] }>()

useInfiniteScroll(useTemplateRef('sentinel'), () => emit('more'))
</script>

<template>
  <div class="flex flex-col gap-6">
    <DramaGrid :items="items" :loading="loading" :skeleton="items.length ? 6 : 12" />
    <StatusBlock v-if="error" :error="error" @retry="emit('retry')" />
    <StatusBlock v-else-if="!loading && !items.length" :empty="empty" />
    <p ref="sentinel" class="min-h-5 text-center text-13 text-fg-5">
      <template v-if="!hasMore && items.length">已经到底了</template>
    </p>
  </div>
</template>
