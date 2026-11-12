<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import type { IconName } from '@renderer/components/ui/icons'

/** 点赞 / 追剧 / 分享：竖屏为右侧纵向圆钮，横屏为画面下方横排胶囊 */
const liked = defineModel<boolean>('liked', { default: false })
const { direction, likes, followed } = defineProps<{
  direction: 'vertical' | 'horizontal'
  likes: string
  followed: boolean
}>()
const emit = defineEmits<{ follow: []; share: [] }>()

const actions = computed<
  { key: string; icon: IconName; label: string; on?: boolean; run: () => void }[]
>(() => [
  {
    key: 'like',
    icon: liked.value ? 'heart' : 'heart-line',
    label: likes,
    on: liked.value,
    run: () => (liked.value = !liked.value)
  },
  {
    key: 'follow',
    icon: 'star',
    label: followed ? '已追' : '追剧',
    on: followed,
    run: () => emit('follow')
  },
  { key: 'share', icon: 'share', label: '分享', run: () => emit('share') }
])

const LAYOUTS = {
  vertical: {
    rail: 'w-14 flex-col gap-[22px]',
    act: 'flex-col gap-1.5',
    ico: 'size-12 bg-white/14 group-hover/act:bg-white/25',
    label: 'text-11 text-fg-2c'
  },
  horizontal: {
    rail: 'gap-3',
    act: 'gap-2.5 rounded-[24px] bg-white/10 py-1.5 pr-4 pl-1.5 transition-colors duration-150 hover:bg-white/14',
    ico: 'size-8',
    label: 'text-13 font-medium text-fg-1'
  }
}
const ON: Record<string, string> = { like: 'text-brand', follow: 'text-brand-3' }
</script>

<template>
  <div class="flex" :class="LAYOUTS[direction].rail">
    <button
      v-for="a in actions"
      :key="a.key"
      class="group/act flex items-center text-fg-1"
      :class="LAYOUTS[direction].act"
      @click="a.run"
    >
      <span
        class="grid place-items-center rounded-full transition-[background-color,scale] duration-[150ms,200ms] ease-[ease,var(--ease-out)] group-active/act:scale-90"
        :class="[LAYOUTS[direction].ico, a.on && ON[a.key]]"
      >
        <AppIcon :name="a.icon" :size="18" />
      </span>
      <span :class="LAYOUTS[direction].label">{{ a.label }}</span>
    </button>
  </div>
</template>
