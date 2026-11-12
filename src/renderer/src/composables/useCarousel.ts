import { useIntervalFn } from '@vueuse/core'
import { ref, type Ref } from 'vue'

/** 循环轮播：6s 自动切换，悬停暂停；direction 供过渡动画使用 */
export function useCarousel(count: Ref<number>, interval = 6000) {
  const index = ref(0)
  const direction = ref<'next' | 'prev'>('next')
  const hovering = ref(false)

  function go(i: number): void {
    if (!count.value) return
    direction.value = i < index.value ? 'prev' : 'next'
    index.value = (i + count.value) % count.value
  }

  const next = (): void => {
    direction.value = 'next'
    index.value = count.value ? (index.value + 1) % count.value : 0
  }
  const prev = (): void => {
    direction.value = 'prev'
    index.value = count.value ? (index.value - 1 + count.value) % count.value : 0
  }

  const timer = useIntervalFn(() => !hovering.value && next(), interval)
  const restart = (): void => {
    timer.pause()
    timer.resume()
  }

  return {
    index,
    direction,
    hovering,
    go: (i: number) => (go(i), restart()),
    next: () => (next(), restart()),
    prev: () => (prev(), restart())
  }
}
