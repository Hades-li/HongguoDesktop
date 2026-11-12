import { defineStore } from 'pinia'
import { ref } from 'vue'

export const RATES = [0.75, 1, 1.25, 1.5, 2] as const

/** 播放偏好（持久化）；播放运行态在 useVideoPlayer 中 */
export const usePlayerStore = defineStore(
  'player',
  () => {
    const volume = ref(1)
    const muted = ref(false)
    const rate = ref<number>(1)
    const autoNext = ref(true)
    const drawerOpen = ref(true)
    const theater = ref(false)

    function cycleRate(): void {
      const i = RATES.indexOf(rate.value as (typeof RATES)[number])
      rate.value = RATES[(i + 1) % RATES.length]
    }

    return { volume, muted, rate, autoNext, drawerOpen, theater, cycleRate }
  },
  { persist: { key: 'hg:player', pick: ['volume', 'muted', 'rate', 'autoNext', 'drawerOpen'] } }
)
