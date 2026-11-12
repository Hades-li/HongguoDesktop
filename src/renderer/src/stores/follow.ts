import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { call } from '@renderer/services/api'

export interface FollowItem {
  seriesId: string
  title: string
  cover: string
  totalEp: number
  /** 追剧时 / 最近一次查看时的集数，用来算「N 更新」 */
  seenEp: number
  followedAt: number
}

export const useFollowStore = defineStore(
  'follow',
  () => {
    const items = ref<Record<string, FollowItem>>({})

    const list = computed(() =>
      Object.values(items.value).sort((a, b) => b.followedAt - a.followedAt)
    )
    const updateCount = computed(() => list.value.filter((f) => f.totalEp > f.seenEp).length)

    const has = (id: string): boolean => id in items.value

    function toggle(item: Omit<FollowItem, 'followedAt' | 'seenEp'>): boolean {
      if (has(item.seriesId)) {
        delete items.value[item.seriesId]
        return false
      }
      items.value[item.seriesId] = { ...item, seenEp: item.totalEp, followedAt: Date.now() }
      return true
    }

    function markSeen(id: string): void {
      const f = items.value[id]
      if (f) f.seenEp = f.totalEp
    }

    /** 拉最新集数，驱动侧栏「N 更新」角标 */
    async function refresh(): Promise<void> {
      const ids = Object.keys(items.value)
      if (!ids.length) return
      const details = await call('getSeriesBatch', ids).catch(() => [])
      for (const { series } of details) {
        const f = items.value[series.id]
        if (f && series.episode_count) f.totalEp = series.episode_count
      }
    }

    return { items, list, updateCount, has, toggle, markSeen, refresh }
  },
  { persist: { key: 'hg:follow', pick: ['items'] } }
)
