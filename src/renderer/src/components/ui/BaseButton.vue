<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import type { IconName } from './icons'

const {
  variant = 'primary',
  size = 'lg',
  icon
} = defineProps<{
  variant?: 'primary' | 'glass' | 'ghost'
  size?: 'lg' | 'sm'
  icon?: IconName
}>()

const SIZES = {
  lg: 'h-[46px] px-6 rounded-[23px] text-15 font-medium',
  sm: 'h-[30px] px-4 rounded-[15px] text-12 font-medium'
}
const VARIANTS = {
  primary: 'bg-brand-gradient text-fg-1 font-bold shadow-primary hover:brightness-108',
  glass: 'bg-white/14 text-fg-1 backdrop-blur-md hover:bg-white/25',
  ghost: 'bg-ghost text-fg-1 hover:bg-brand'
}
</script>

<template>
  <button
    class="inline-flex items-center justify-center gap-2 whitespace-nowrap transition duration-150 active:scale-97"
    :class="[SIZES[size], VARIANTS[variant]]"
  >
    <AppIcon v-if="icon" :name="icon" :size="size === 'lg' ? 18 : 14" />
    <slot />
  </button>
</template>
