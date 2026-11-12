import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { UpdateState } from '@shared/update'

export const useUpdateStore = defineStore('update', () => {
  const state = ref<UpdateState>({ phase: 'idle' })
  const api = window.api.update

  api.onChange((next) => (state.value = next))
  void api.state().then((next) => (state.value = next))

  const percent = computed(() => {
    const s = state.value
    return s.phase === 'downloading' && s.total > 0
      ? Math.min(99, Math.floor((s.received / s.total) * 100))
      : 0
  })

  return { state, percent, download: api.download, install: api.install }
})
