import type { RankItem, Series, SeriesSummary } from 'openhongguo'

const PIC_HASH = /\/novel-pic\/([0-9a-f]{16,})~/

/**
 * SDK 给的封面是带签名的 HEIC（Chromium 无法解码）。
 * 同一 hash 换到 byteimg 的 shrink 模板即得到无签名、可长期缓存的 JPEG。
 */
export function coverUrl(url?: string, width = 400): string {
  if (!url) return ''
  const match = PIC_HASH.exec(url)
  return match
    ? `https://p6-novel.byteimg.com/novel-pic/${match[1]}~tplv-shrink:${width}:0.image`
    : url
}

export function heatText(heat?: number): string {
  if (!heat) return ''
  if (heat >= 1e8) return `${(heat / 1e8).toFixed(1)}亿热度`
  if (heat >= 1e4) return `${Math.round(heat / 1e4)}万热度`
  return `${heat}热度`
}

export function countText(n?: number): string {
  if (!n) return '0'
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}亿`
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)}万`
  return String(n)
}

type EpisodeInfo = Pick<Series, 'episode_count' | 'status' | 'right_text'>

export function episodesText(s?: Partial<EpisodeInfo>): string {
  if (!s) return ''
  if (s.right_text) return s.right_text
  if (!s.episode_count) return ''
  return s.status === 0 ? `更新至${s.episode_count}集` : `全${s.episode_count}集`
}

export const statusText = (s?: Series): string => (s?.status === 0 ? '更新中' : '已完结')

export function tagsOf(s?: Series, limit = 3): string[] {
  return (s?.rows ?? [])
    .filter((row) => row.kind === 3)
    .map((row) => row.text)
    .slice(0, limit)
}

export const yearOf = (s?: Series): string => s?.created_at?.slice(0, 4) ?? ''

export function kindOf(s?: Series): string {
  if (!s) return ''
  return s.content_type === 1004 ? '漫剧' : '短剧'
}

export function clock(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export const rankNo = (n: number): string => String(n).padStart(2, '0')

/** 列表里统一使用的剧集条目（排行 / 筛选 / 推荐 / 搜索都能映射过来） */
export type DramaItem = Pick<SeriesSummary, 'id' | 'title' | 'cover_url' | 'episode_count'> & {
  description?: string
}

export const fromRank = (r: RankItem): DramaItem => ({
  id: r.series_id ?? '',
  title: r.title ?? '',
  cover_url: r.cover_url,
  episode_count: r.episode_count
})
