<script setup lang="ts">
const model = defineModel<number>({ required: true })
const { ranges, size = 'md' } = defineProps<{
  ranges: { value: number; label: string }[]
  size?: 'md' | 'sm'
}>()

const SIZES = {
  md: { nav: 'gap-5', btn: 'text-13' },
  sm: { nav: 'gap-4', btn: 'text-12' }
}
</script>

<template>
  <nav
    class="flex min-w-0 [scrollbar-width:none] overflow-x-auto font-num [&::-webkit-scrollbar]:hidden"
    :class="SIZES[size].nav"
  >
    <button
      v-for="r in ranges"
      :key="r.value"
      class="flex-none transition-colors duration-150"
      :class="[
        SIZES[size].btn,
        r.value === model ? 'font-bold text-brand' : 'text-fg-4b hover:text-fg-2c'
      ]"
      @click="model = r.value"
    >
      {{ r.label }}
    </button>
  </nav>
</template>
