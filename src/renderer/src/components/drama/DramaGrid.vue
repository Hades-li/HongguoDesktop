<script setup lang="ts">
import type { DramaItem } from '@renderer/services/format'
import DramaCard from './DramaCard.vue'

/** 列数默认 auto-fill；父组件可在根元素上设置 --drama-cols 覆盖，如 class="[--drama-cols:repeat(6,1fr)]" */
const {
  items,
  loading = false,
  skeleton = 6
} = defineProps<{
  items: DramaItem[]
  loading?: boolean
  skeleton?: number
}>()
</script>

<template>
  <div
    class="grid grid-cols-[var(--drama-cols,repeat(auto-fill,minmax(160px,1fr)))] gap-x-4 gap-y-6"
  >
    <DramaCard v-for="it in items" :key="it.id" :item="it" />
    <template v-if="loading">
      <div v-for="i in skeleton" :key="`s${i}`" class="flex flex-col gap-2">
        <div class="aspect-172/240 skeleton" />
        <div class="h-3.5 w-4/5 skeleton rounded-4" />
        <div class="h-3.5 w-1/2 skeleton rounded-4" />
      </div>
    </template>
  </div>
</template>
