import { useIntersectionObserver } from '@vueuse/core'
import type { Ref } from 'vue'

/** 哨兵元素进入视口（提前 300px）时触发加载 */
export function useInfiniteScroll(sentinel: Ref<HTMLElement | null>, load: () => void): void {
  useIntersectionObserver(sentinel, ([entry]) => entry?.isIntersecting && load(), {
    rootMargin: '0px 0px 300px 0px'
  })
}
