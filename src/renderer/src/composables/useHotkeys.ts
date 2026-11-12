import { useEventListener } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { useUiStore } from '@renderer/stores/ui'

export const isTyping = (e: KeyboardEvent): boolean => {
  const el = e.target as HTMLElement | null
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
}

const isMod = (e: KeyboardEvent): boolean =>
  navigator.userAgent.includes('Mac') ? e.metaKey : e.ctrlKey

/** 全局：⌘K 搜索 · ⌘[ / ⌘] 后退前进（Windows：Ctrl / Alt+← →） */
export function useGlobalHotkeys(): void {
  const router = useRouter()
  const ui = useUiStore()

  useEventListener(window, 'keydown', (e: KeyboardEvent) => {
    if (isMod(e) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      ui.searchOpen = !ui.searchOpen
    } else if ((isMod(e) && e.key === '[') || (e.altKey && e.key === 'ArrowLeft')) {
      e.preventDefault()
      router.back()
    } else if ((isMod(e) && e.key === ']') || (e.altKey && e.key === 'ArrowRight')) {
      e.preventDefault()
      router.forward()
    }
  })
}

/** 页面级快捷键：输入框聚焦或搜索浮层打开时不触发 */
export function useKeymap(map: Record<string, (e: KeyboardEvent) => void>): void {
  const ui = useUiStore()
  useEventListener(window, 'keydown', (e: KeyboardEvent) => {
    if (ui.searchOpen || isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return
    const handler = map[e.key.length === 1 ? e.key.toLowerCase() : e.key]
    if (!handler) return
    e.preventDefault()
    handler(e)
  })
}
