<script setup lang="ts">
import { computed, ref } from 'vue'

/** 可拖拽进度条：拖动中只更新视觉，松手再 seek */
const { current, duration } = defineProps<{ current: number; duration: number }>()
const emit = defineEmits<{ seek: [t: number] }>()

const dragging = ref<number>()
const ratio = computed(() => (dragging.value ?? (duration ? current / duration : 0)) * 100)

function at(e: PointerEvent): number {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
}

function down(e: PointerEvent): void {
  if (!duration) return
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  dragging.value = at(e)
}

function up(e: PointerEvent): void {
  if (dragging.value === undefined) return
  emit('seek', at(e) * duration)
  dragging.value = undefined
}
</script>

<template>
  <div
    class="group/bar cursor-pointer py-1.5"
    @pointerdown="down"
    @pointermove="(e) => dragging !== undefined && (dragging = at(e))"
    @pointerup="up"
    @pointercancel="dragging = undefined"
    @click.stop
  >
    <div
      class="relative rounded-[2px] bg-white/25 transition-[height] duration-150"
      :class="dragging !== undefined ? 'h-1.5' : 'h-1 group-hover/bar:h-1.5'"
    >
      <i
        class="absolute inset-y-0 left-0 rounded-[inherit] bg-brand"
        :style="{ width: `${ratio}%` }"
      />
      <i
        class="absolute top-1/2 size-3 -translate-1/2 rounded-full bg-fg-1 shadow-[0_1px_4px_rgba(0,0,0,0.4)]"
        :style="{ left: `${ratio}%` }"
      />
    </div>
  </div>
</template>
