import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { DramaItem } from '@renderer/services/format'
import { useFollowStore } from '@renderer/stores/follow'
import { useUiStore } from '@renderer/stores/ui'

/** 追剧按钮：状态 + 切换 + Toast（Hero / 详情 / 播放页共用） */
export function useFollowToggle(target: MaybeRefOrGetter<DramaItem | undefined>) {
  const follow = useFollowStore()
  const ui = useUiStore()

  const followed = computed(() => {
    const it = toValue(target)
    return !!it?.id && follow.has(it.id)
  })

  function toggle(): void {
    const it = toValue(target)
    if (!it?.id) return
    const on = follow.toggle({
      seriesId: it.id,
      title: it.title,
      cover: it.cover_url ?? '',
      totalEp: it.episode_count ?? 0
    })
    ui.toast(on ? '已加入我的追剧' : '已取消追剧')
  }

  return { followed, toggle }
}

/** 分享：复制剧名文案到剪贴板 */
export function useShare() {
  const ui = useUiStore()
  return async (title?: string): Promise<void> => {
    if (!title) return
    await navigator.clipboard.writeText(`我在红果短剧追《${title}》，一起来看吧！`)
    ui.toast('分享文案已复制')
  }
}
