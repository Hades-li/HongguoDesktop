import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'
import type { SeriesSummary } from 'openhongguo'
import { call } from '@renderer/services/api'
import { GENRES, TTL, type GenreKey } from '@shared/constants'
import { useSeriesStore } from './series'

export type HotTab = 'all' | GenreKey

interface Block {
  items: SeriesSummary[]
  loading: boolean
  error?: unknown
  fetchedAt: number
}

/** 首页「热播短剧」分类 Tab 的数据；Hero / TOP5 复用 rank store */
export const useHomeStore = defineStore('home', () => {
  const hot = shallowReactive(new Map<HotTab, Block>())
  const seriesStore = useSeriesStore()

  async function loadHot(tab: HotTab): Promise<void> {
    const prev = hot.get(tab)
    if (prev?.loading || (prev && !prev.error && Date.now() - prev.fetchedAt < TTL.list)) return
    hot.set(tab, { items: prev?.items ?? [], loading: true, fetchedAt: 0 })
    try {
      const selections = tab === 'all' ? undefined : { genre: [GENRES[tab].genre] }
      const res = await call('shortFilter', { selections })
      const items = res.items.slice(0, 12)
      hot.set(tab, { items, loading: false, fetchedAt: Date.now() })
      void seriesStore.prefetch(items.map((i) => i.id))
    } catch (error) {
      hot.set(tab, { items: [], loading: false, error, fetchedAt: 0 })
    }
  }

  return { hot, loadHot }
})
