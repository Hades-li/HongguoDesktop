import { computed, ref, shallowRef, watch, type Ref } from 'vue'
import type { Episode, Playback } from 'openhongguo'
import { ApiError, call } from '@renderer/services/api'
import { isExpired, playableStreams } from '@renderer/services/stream'

const unplayable = (code: string): ApiError =>
  new ApiError({ code, message: '该集暂不可播放', retryable: false, retryAfterMs: 0 })

/** 解析当前分集的播放地址；切集自动重新解析，过期地址重取 */
export function usePlayback(episode: Ref<Episode | undefined>) {
  const playback = shallowRef<Playback>()
  const error = shallowRef<unknown>()
  const loading = ref(false)
  const quality = ref(0)
  let token = 0

  const streams = computed(() => (playback.value ? playableStreams(playback.value) : []))
  const stream = computed(() => streams.value[Math.min(quality.value, streams.value.length - 1)])

  async function resolve(): Promise<void> {
    const ep = episode.value
    const t = ++token
    playback.value = undefined
    error.value = undefined
    if (!ep) return
    loading.value = true
    try {
      if (!ep.playable) throw unplayable('CONTENT_UNAVAILABLE')
      const { playback: pb } = await call('resolvePlayback', ep.id)
      if (t !== token) return
      if (!playableStreams(pb).length)
        throw unplayable(pb.protected ? 'DRM_PROTECTED' : 'CONTENT_UNAVAILABLE')
      playback.value = pb
    } catch (e) {
      if (t === token) error.value = e
    } finally {
      if (t === token) loading.value = false
    }
  }

  /** 换一台匿名设备再试 */
  async function resetDevice(): Promise<void> {
    loading.value = true
    await call('resetDevice').catch(() => undefined)
    return resolve()
  }

  /** 媒体出错时若是地址过期，重新解析 */
  const refreshIfExpired = (): boolean =>
    !!playback.value && isExpired(playback.value) && (void resolve(), true)

  const cycleQuality = (): void => {
    if (streams.value.length > 1) quality.value = (quality.value + 1) % streams.value.length
  }

  watch(() => episode.value?.id, resolve, { immediate: true })

  return {
    playback,
    streams,
    stream,
    loading,
    error,
    resolve,
    resetDevice,
    refreshIfExpired,
    cycleQuality
  }
}
