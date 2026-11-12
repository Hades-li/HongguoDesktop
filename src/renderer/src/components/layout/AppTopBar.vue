<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import { isMac } from '@renderer/services/platform'
import { useSearchStore } from '@renderer/stores/search'
import { useUiStore } from '@renderer/stores/ui'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const searchStore = useSearchStore()
const { hot } = storeToRefs(searchStore)

const nav = computed(() => {
  void route.fullPath
  const state = window.history.state as { back?: string; forward?: string } | null
  return { back: !!state?.back, forward: !!state?.forward }
})
const hotWords = computed(() => (hot.value?.guesses ?? []).slice(0, 3).map((g) => g.title))

onMounted(searchStore.loadHot)

const CIRCLE =
  'no-drag grid size-8 place-items-center rounded-full bg-card text-fg-1 transition-[background-color] duration-150 enabled:hover:bg-tile-hover disabled:text-fg-5'
</script>

<template>
  <header class="flex h-10 flex-none items-center gap-3 drag">
    <button :class="CIRCLE" :disabled="!nav.back" title="后退" @click="router.back()">
      <AppIcon name="back" :size="16" />
    </button>
    <button :class="CIRCLE" :disabled="!nav.forward" title="前进" @click="router.forward()">
      <AppIcon name="forward" :size="16" />
    </button>
    <button
      class="flex h-10 w-[420px] items-center gap-2.5 rounded-20 border border-white/6 bg-card pr-2 pl-4 text-fg-4c transition-colors duration-150 no-drag hover:border-white/14"
      @click="ui.searchOpen = true"
    >
      <AppIcon name="search" :size="16" />
      <span class="flex-1 text-left text-13">搜索剧名、演员、题材</span>
      <kbd class="rounded-[5px] bg-kbd px-1.5 py-0.5 font-num text-11 font-medium text-fg-4">{{
        isMac ? '⌘K' : 'Ctrl K'
      }}</kbd>
    </button>
    <p v-if="hotWords.length" class="truncate text-12 text-fg-4c no-drag">
      热搜：
      <template v-for="(w, i) in hotWords" :key="w">
        <a
          class="cursor-pointer hover:text-fg-1"
          @click="router.push({ name: 'search', query: { q: w } })"
          >{{ w }}</a
        >
        <span v-if="i < hotWords.length - 1"> · </span>
      </template>
    </p>
  </header>
</template>
