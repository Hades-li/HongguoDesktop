import { useIntervalFn, useThrottleFn } from '@vueuse/core'
import { onBeforeUnmount, ref, watch, type Ref } from 'vue'
import type { Episode, Series } from 'openhongguo'
import { useHistoryStore } from '@renderer/stores/history'
import type { VideoPlayer } from './useVideoPlayer'

const COUNTDOWN = 5

/** 单集播完后 5s 倒计时自动连播；切集或手动取消即停止 */
export function useAutoNext(enabled: Ref<boolean>, hasNext: () => boolean, goNext: () => void) {
  const countdown = ref<number>()
  const { pause, resume } = useIntervalFn(
    () => {
      countdown.value = Math.max(0, (countdown.value ?? 0) - 0.1)
      if (countdown.value === 0) {
        cancel()
        goNext()
      }
    },
    100,
    { immediate: false }
  )

  function start(): void {
    if (!enabled.value || !hasNext()) return
    countdown.value = COUNTDOWN
    resume()
  }

  function cancel(): void {
    pause()
    countdown.value = undefined
  }

  watch(enabled, (on) => !on && cancel())
  onBeforeUnmount(cancel)

  return { countdown, total: COUNTDOWN, start, cancel }
}

/** 观看历史：进入分集立即记录，播放进度节流 5s 写入；切集前由调用方 save()，离开时自动落盘 */
export function usePlayHistory(
  series: Ref<Series | undefined>,
  episode: Ref<Episode | undefined>,
  player: VideoPlayer
) {
  const history = useHistoryStore()

  /** 视频就绪时记下它属于哪一集；只信任该集的进度，避免切集瞬间把上一集进度写到新集 */
  let loadedEp: string | undefined
  watch(
    () => player.ready,
    (ready) => (loadedEp = ready ? episode.value?.id : undefined),
    { flush: 'sync' }
  )

  function save(): void {
    const s = series.value
    const ep = episode.value
    if (!s || !ep) return
    const live = loadedEp === ep.id
    const prev = history.records[s.id]
    const kept = prev?.episodeId === ep.id ? prev : undefined
    history.upsert({
      seriesId: s.id,
      title: s.title,
      cover: s.cover_url ?? '',
      epNumber: ep.number,
      episodeId: ep.id,
      positionSec: live ? player.current : (kept?.positionSec ?? 0),
      durationSec: live ? player.duration : (kept?.durationSec ?? 0),
      totalEp: s.episode_count ?? 0
    })
  }

  const throttled = useThrottleFn(save, 5000)
  watch(
    () => player.current,
    () => loadedEp && throttled()
  )
  watch([series, () => episode.value?.id], save, { immediate: true })
  onBeforeUnmount(save)

  return { save }
}
