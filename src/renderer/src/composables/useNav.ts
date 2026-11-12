import { useRouter } from 'vue-router'

/** 跳详情 / 播放页的统一入口 */
export function useNav() {
  const router = useRouter()
  return {
    openDetail: (id: string) => router.push({ name: 'detail', query: { series_id: id } }),
    play: (id: string, ep?: number) =>
      router.push({ name: 'play', query: { series_id: id, ...(ep ? { ep } : {}) } })
  }
}
