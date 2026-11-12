import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { HotSearch } from 'openhongguo'
import { call } from '@renderer/services/api'

export const useSearchStore = defineStore(
  'search',
  () => {
    const recent = ref<string[]>([])
    const hot = ref<HotSearch>()

    function remember(query: string): void {
      const q = query.trim()
      if (!q) return
      recent.value = [q, ...recent.value.filter((r) => r !== q)].slice(0, 10)
    }

    async function loadHot(): Promise<void> {
      hot.value ??= await call('hotSearch').catch(() => undefined)
    }

    return { recent, hot, remember, loadHot }
  },
  { persist: { key: 'hg:search', pick: ['recent'] } }
)
