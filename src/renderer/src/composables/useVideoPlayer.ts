import Hls from 'hls.js'
import { createEventHook, useEventListener, useFullscreen, useIdle } from '@vueuse/core'
import {
  computed,
  onBeforeUnmount,
  reactive,
  ref,
  shallowRef,
  watch,
  watchEffect,
  type InjectionKey,
  type Ref
} from 'vue'
import type { Stream } from 'openhongguo'
import { usePlayerStore } from '@renderer/stores/player'

/**
 * <video> + hls.js 生命周期、播放运行态、全屏、3s 无操作隐藏控制条。
 * 返回 reactive 对象，经 provide/inject 给子组件直接读写（el / frame 由模板函数 ref 赋值）。
 */
export function useVideoPlayer(source: Ref<Stream | undefined>, startAt: Ref<number>) {
  const store = usePlayerStore()
  const el = shallowRef<HTMLVideoElement | null>(null)
  const frame = shallowRef<HTMLElement | null>(null)
  const playing = ref(false)
  const waiting = ref(false)
  const ready = ref(false)
  const current = ref(0)
  const duration = ref(0)
  const mediaError = ref<string>()
  const ended = createEventHook<void>()
  let hls: Hls | undefined

  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(frame)
  const { idle } = useIdle(3000)
  const showUi = computed(() => !idle.value || !playing.value)

  function detach(v?: HTMLVideoElement | null): void {
    hls?.destroy()
    hls = undefined
    if (v?.src) {
      v.removeAttribute('src')
      v.load()
    }
  }

  watch([el, source], ([v, s], [oldV]) => {
    detach(oldV !== v ? oldV : v)
    playing.value = ready.value = waiting.value = false
    current.value = duration.value = 0
    mediaError.value = undefined
    if (!v || !s?.url) return
    const at = startAt.value
    v.addEventListener(
      'loadedmetadata',
      () => {
        if (at > 0 && at < v.duration - 3) v.currentTime = at
        applyPrefs(v)
        v.play().catch(() => undefined)
      },
      { once: true }
    )
    if (s.hls && Hls.isSupported()) {
      hls = new Hls({ startPosition: at > 0 ? at : -1 })
      hls.on(Hls.Events.ERROR, (_, data) => data.fatal && (mediaError.value = '视频加载失败'))
      hls.loadSource(s.url)
      hls.attachMedia(v)
    } else {
      v.src = s.url
    }
  })

  function applyPrefs(v: HTMLVideoElement): void {
    v.defaultPlaybackRate = v.playbackRate = store.rate
    v.volume = store.volume
    v.muted = store.muted
  }
  watchEffect(() => el.value && applyPrefs(el.value))

  useEventListener(el, 'play', () => (playing.value = true))
  useEventListener(el, 'pause', () => (playing.value = false))
  useEventListener(el, 'waiting', () => (waiting.value = true))
  useEventListener(el, 'playing', () => (waiting.value = false))
  useEventListener(el, 'loadeddata', () => (ready.value = true))
  useEventListener(el, 'timeupdate', () => (current.value = el.value?.currentTime ?? 0))
  useEventListener(el, 'durationchange', () => (duration.value = el.value?.duration || 0))
  useEventListener(el, 'ended', () => ended.trigger())
  useEventListener(el, 'error', () => !hls && (mediaError.value = '视频加载失败'))

  function toggle(): void {
    const v = el.value
    if (!v?.src && !hls) return
    if (v?.paused) void v.play().catch(() => undefined)
    else v?.pause()
  }

  function seek(t: number): void {
    const v = el.value
    if (!v || !duration.value) return
    v.currentTime = Math.max(0, Math.min(duration.value - 0.1, t))
    current.value = v.currentTime
  }

  onBeforeUnmount(() => detach(el.value))

  return reactive({
    el,
    frame,
    playing,
    waiting,
    ready,
    current,
    duration,
    mediaError,
    isFullscreen,
    showUi,
    onEnded: ended.on,
    toggle,
    seek,
    seekBy: (d: number) => seek(current.value + d),
    toggleFullscreen,
    toggleMute: () => (store.muted = !store.muted)
  })
}

export type VideoPlayer = ReturnType<typeof useVideoPlayer>
export const PLAYER_KEY: InjectionKey<VideoPlayer> = Symbol('player')
