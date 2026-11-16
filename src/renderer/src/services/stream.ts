import type { Episode, Playback, Stream } from 'openhongguo'
import { MEDIA_SCHEME } from '@shared/constants'

export type PlayerLayout = 'portrait' | 'landscape'

/** 非 DASH 的流；加密流仅在已换成主进程解密代理地址时可播；按分辨率从高到低 */
export function playableStreams(playback: Playback): Stream[] {
  return playback.streams
    .filter((s) => s.url && !s.dash && (!s.protected || s.url.startsWith(`${MEDIA_SCHEME}:`)))
    .sort((a, b) => (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0))
}

export const isExpired = (playback: Playback): boolean =>
  !!playback.expires_at && playback.expires_at * 1000 < Date.now() + 30_000

export function qualityLabel(stream?: Stream): string {
  if (!stream) return '自动'
  if (stream.definition) return stream.definition.toUpperCase()
  const short = Math.min(stream.width ?? 0, stream.height ?? 0)
  return short ? `${short}P` : '自动'
}

/** 片源宽高比优先；拿不到流时按分集的 vertical 标记判断（漫剧不带该标记，短剧默认竖屏） */
export function layoutOf(stream?: Stream, episode?: Episode): PlayerLayout {
  if (stream?.width && stream.height)
    return stream.width >= stream.height ? 'landscape' : 'portrait'
  return episode?.vertical === false ? 'landscape' : 'portrait'
}

/** 「第 14 集」+ 有意义的分集标题 */
export function episodeTitle(ep?: Episode): string {
  if (!ep) return ''
  const t = ep.title?.trim()
  return t && !/^第\s*\d+\s*集$/.test(t) ? `第 ${ep.number} 集「${t}」` : `第 ${ep.number} 集`
}
