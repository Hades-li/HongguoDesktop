import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'
import type { RankItem } from 'openhongguo'
import { call } from '@renderer/services/api'
import { RANK_TYPES, TTL, type RankBoardKey, type RankType } from '@shared/constants'

export interface RankPage {
  items: RankItem[]
  cursor?: string
  hasMore: boolean
  loading: boolean
  error?: unknown
  fetchedAt: number
}

/** 按 type+board 缓存榜单分页；推广行（平台推荐）不进列表 */
export const useRankStore = defineStore('rank', () => {
  const pages = shallowReactive(new Map<string, RankPage>())

  const keyOf = (type: RankType, board: RankBoardKey): string => `${type}/${board}`

  async function load(type: RankType, board: RankBoardKey, more = false): Promise<void> {
    const key = keyOf(type, board)
    const prev = pages.get(key)
    if (prev?.loading) return
    if (!more && prev && !prev.error && Date.now() - prev.fetchedAt < TTL.list) return
    if (more && !prev?.hasMore) return

    const base: RankPage =
      more && prev ? prev : { items: [], hasMore: true, loading: false, fetchedAt: 0 }
    pages.set(key, { ...base, loading: true, error: undefined })
    try {
      const { content, boards } = RANK_TYPES[type]
      const res = await call('shortRank', { content, board: boards[board], cursor: base.cursor })
      const items = [...base.items, ...res.items.filter((i) => i.series_id && !i.promoted)]
      pages.set(key, {
        items,
        cursor: res.cursor,
        hasMore: res.has_more && !!res.cursor,
        loading: false,
        fetchedAt: Date.now()
      })
    } catch (error) {
      pages.set(key, { ...base, loading: false, error })
    }
  }

  return { pages, keyOf, load }
})
