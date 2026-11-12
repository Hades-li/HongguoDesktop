import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'
import type { Episode, Recommend, Series } from 'openhongguo'
import { call } from '@renderer/services/api'

/** 剧集详情 / 分集 / 推荐的内存缓存；并发请求同一部剧只发一次 */
export const useSeriesStore = defineStore('series', () => {
  const series = shallowReactive(new Map<string, Series>())
  const episodes = shallowReactive(new Map<string, Episode[]>())
  const recommends = shallowReactive(new Map<string, Recommend>())
  const inflight = new Map<string, Promise<unknown>>()

  function once<T>(key: string, run: () => Promise<T>): Promise<T> {
    const hit = inflight.get(key) as Promise<T> | undefined
    if (hit) return hit
    const task = run().finally(() => inflight.delete(key))
    inflight.set(key, task)
    return task
  }

  async function ensureSeries(id: string): Promise<Series> {
    return series.get(id) ?? once(`s:${id}`, () => call('getSeries', id)).then(remember)
  }

  function remember(s: Series): Series {
    series.set(s.id, s)
    return s
  }

  async function ensureEpisodes(id: string): Promise<Episode[]> {
    const cached = episodes.get(id)
    if (cached) return cached
    return once(`e:${id}`, async () => {
      const all: Episode[] = []
      let cursor: string | undefined
      do {
        const page = await call('listEpisodes', id, { cursor, pageSize: 500 })
        all.push(...page.items)
        cursor = page.has_more ? page.cursor : undefined
      } while (cursor)
      episodes.set(id, all)
      return all
    })
  }

  async function ensureRecommend(id: string): Promise<Recommend> {
    const cached = recommends.get(id)
    if (cached) return cached
    return once(`r:${id}`, async () => {
      const rec = await call('seriesRecommend', id)
      recommends.set(id, rec)
      return rec
    })
  }

  /** 列表页批量补齐详情（标签、简介、状态），已缓存的跳过 */
  async function prefetch(ids: string[]): Promise<void> {
    const missing = [...new Set(ids)].filter((id) => id && !series.has(id))
    if (!missing.length) return
    const details = await call('getSeriesBatch', missing).catch(() => [])
    for (const d of details) {
      remember(d.series)
      if (d.episodes.length && !episodes.has(d.series.id)) episodes.set(d.series.id, d.episodes)
    }
  }

  return { series, episodes, recommends, ensureSeries, ensureEpisodes, ensureRecommend, prefetch }
})
