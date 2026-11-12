import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Toast {
  id: number
  text: string
}

export const useUiStore = defineStore('ui', () => {
  const searchOpen = ref(false)
  const toasts = ref<Toast[]>([])
  const scrollPositions = new Map<string, number>()
  let seq = 0

  function toast(text: string, ms = 2200): void {
    const id = ++seq
    toasts.value.push({ id, text })
    setTimeout(() => (toasts.value = toasts.value.filter((t) => t.id !== id)), ms)
  }

  return { searchOpen, toasts, scrollPositions, toast }
})
