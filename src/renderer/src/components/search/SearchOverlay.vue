<script setup lang="ts">
import { refDebounced, onKeyStroke } from '@vueuse/core'
import { computed, nextTick, ref, shallowRef, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Suggestion } from 'openhongguo'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import { call } from '@renderer/services/api'
import { useSearchStore } from '@renderer/stores/search'
import { useUiStore } from '@renderer/stores/ui'

const ui = useUiStore()
const searchStore = useSearchStore()
const router = useRouter()
const input = useTemplateRef('input')

const query = ref('')
const debounced = refDebounced(query, 200)
const suggestions = shallowRef<Suggestion[]>([])
const active = ref(-1)

const topics = computed(
  () => searchStore.hot?.boards?.find((b) => b.topics?.length)?.topics?.slice(0, 8) ?? []
)
const guesses = computed(() => searchStore.hot?.guesses?.slice(0, 8) ?? [])

watch(debounced, async (q) => {
  active.value = -1
  const text = q.trim()
  const list = text ? await call('suggest', text).catch(() => []) : []
  if (text === query.value.trim()) suggestions.value = list.slice(0, 8)
})

watch(
  () => ui.searchOpen,
  async (open) => {
    if (!open) return
    void searchStore.loadHot()
    await nextTick()
    input.value?.select()
  }
)

function close(): void {
  ui.searchOpen = false
}

function submit(q = query.value): void {
  const text = q.trim()
  if (!text) return
  searchStore.remember(text)
  query.value = text
  close()
  void router.push({ name: 'search', query: { q: text } })
}

/** 带 keyword 的联想项是直达剧集 */
function pick(s: Suggestion): void {
  if (s.kind === 2 && s.keyword && /^\d+$/.test(s.keyword)) {
    searchStore.remember(s.text)
    close()
    void router.push({ name: 'detail', query: { series_id: s.keyword } })
  } else submit(s.text)
}

/** ↑ ↓ 在 [-1, n) 之间循环，-1 表示停在输入框 */
function move(d: number): void {
  const n = suggestions.value.length + 1
  active.value = ((active.value + 1 + d + n) % n) - 1
}

onKeyStroke('Escape', () => ui.searchOpen && close())

function onEnter(): void {
  const s = suggestions.value[active.value]
  if (s) pick(s)
  else submit()
}

/** 联想词拆成 [前缀, 命中, 后缀] 用于高亮 */
const rows = computed(() => {
  const q = query.value.trim()
  return suggestions.value.map((s) => {
    const i = q ? s.text.indexOf(q) : -1
    const parts = i < 0 ? [s.text, '', ''] : [s.text.slice(0, i), q, s.text.slice(i + q.length)]
    return { s, parts }
  })
})

const CHIP =
  'max-w-[220px] truncate rounded-full bg-card px-3 py-1.5 text-12 text-fg-3b transition-colors duration-150 hover:bg-tile-hover hover:text-fg-1'
</script>

<template>
  <Transition name="pop">
    <div
      v-if="ui.searchOpen"
      class="fixed inset-0 z-50 flex justify-center bg-black/55 pt-18 backdrop-blur-[4px]"
      @mousedown.self="close"
    >
      <div
        class="flex max-h-[calc(100vh-144px)] w-[600px] flex-col overflow-hidden rounded-16 border border-white/10 bg-panel shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
      >
        <label class="flex h-14 items-center gap-3 border-b border-white/6 px-5 text-fg-4c">
          <AppIcon name="search" :size="18" />
          <input
            ref="input"
            v-model="query"
            class="flex-1 text-16 text-fg-1 placeholder:text-fg-4c"
            placeholder="搜索剧名、演员、题材"
            @keydown.enter.prevent="onEnter"
            @keydown.down.prevent="move(1)"
            @keydown.up.prevent="move(-1)"
          />
          <kbd class="rounded-[5px] bg-kbd px-1.5 py-0.5 font-num text-11 text-fg-4">Esc</kbd>
        </label>

        <ul v-if="query.trim() && suggestions.length" class="overflow-y-auto p-2">
          <li
            v-for="({ s, parts }, i) in rows"
            :key="s.text + i"
            class="flex h-10 cursor-pointer items-center gap-3 rounded-8 px-3 text-14"
            :class="i === active ? 'bg-card-2 text-fg-1' : 'text-fg-2c'"
            @mouseenter="active = i"
            @click="pick(s)"
          >
            <AppIcon :name="s.kind === 2 ? 'play' : 'search'" :size="14" />
            <span class="truncate"
              >{{ parts[0] }}<b class="font-medium text-brand-soft">{{ parts[1] }}</b
              >{{ parts[2] }}</span
            >
            <em v-if="s.kind === 2" class="ml-auto flex-none text-11 text-fg-4b not-italic"
              >直达</em
            >
          </li>
        </ul>

        <div v-else class="flex flex-col gap-[22px] overflow-y-auto p-5">
          <section v-if="searchStore.recent.length">
            <header class="mb-3 flex items-center justify-between">
              <h4 class="text-13 font-semibold text-fg-3">最近搜索</h4>
              <button
                class="text-fg-4c hover:text-fg-1"
                title="清空"
                @click="searchStore.recent = []"
              >
                <AppIcon name="trash" :size="14" />
              </button>
            </header>
            <div class="flex flex-wrap gap-2">
              <button v-for="r in searchStore.recent" :key="r" :class="CHIP" @click="submit(r)">
                {{ r }}
              </button>
            </div>
          </section>
          <section v-if="guesses.length">
            <header class="mb-3 flex items-center justify-between">
              <h4 class="text-13 font-semibold text-fg-3">猜你想搜</h4>
            </header>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="g in guesses"
                :key="g.series_id"
                :class="CHIP"
                @click="submit(g.title)"
              >
                {{ g.title }}
              </button>
            </div>
          </section>
          <section v-if="topics.length">
            <header class="mb-3 flex items-center justify-between">
              <h4 class="text-13 font-semibold text-fg-3">热点话题</h4>
            </header>
            <ol class="grid list-none grid-cols-[1fr_1fr] gap-x-4 gap-y-1">
              <li
                v-for="(t, i) in topics"
                :key="t.id"
                class="flex h-[34px] cursor-pointer items-center gap-2.5 rounded-8 px-2 text-13 text-fg-2c hover:bg-card hover:text-fg-1"
                @click="submit(t.query || t.title)"
              >
                <i
                  class="w-4 flex-none font-num font-bold not-italic"
                  :class="i < 3 ? 'text-brand' : 'text-fg-5'"
                  >{{ i + 1 }}</i
                >
                <span class="truncate">{{ t.title }}</span>
                <small v-if="t.heat" class="ml-auto flex-none text-11 text-fg-5">{{
                  t.heat
                }}</small>
              </li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  </Transition>
</template>
