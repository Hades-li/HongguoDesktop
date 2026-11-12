import { computed, ref, watch, type Ref } from 'vue'
import type { Episode } from 'openhongguo'

/** 选集分区：size 集一段，focus 变化时自动切到所在分区；支持正序 / 倒序 */
export function useEpisodeRanges(
  episodes: Ref<Episode[]>,
  size: number,
  focus: Ref<number | undefined>
) {
  const index = ref(0)
  const reverse = ref(false)

  const ranges = computed(() => {
    const total = episodes.value.length
    const list = Array.from({ length: Math.ceil(total / size) }, (_, i) => ({
      value: i,
      label: `${i * size + 1}-${Math.min(total, (i + 1) * size)}`
    }))
    return reverse.value ? list.reverse() : list
  })

  const visible = computed(() => {
    const list = episodes.value.slice(index.value * size, (index.value + 1) * size)
    return reverse.value ? list.reverse() : list
  })

  watch(
    focus,
    (n) => {
      if (n) index.value = Math.floor((n - 1) / size)
    },
    { immediate: true }
  )

  return { index, reverse, ranges, visible }
}
