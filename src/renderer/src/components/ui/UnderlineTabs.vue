<script setup lang="ts" generic="T extends string">
import { computed, useTemplateRef } from 'vue'

const model = defineModel<T>({ required: true })
const { options } = defineProps<{ options: { value: T; label: string }[] }>()

const items = useTemplateRef<HTMLButtonElement[]>('items')
const bar = computed(() => {
  const el = items.value?.[options.findIndex((o) => o.value === model.value)]
  return el
    ? { transform: `translateX(${el.offsetLeft + el.offsetWidth / 2 - 12}px)` }
    : { opacity: 0 }
})

const TAB = {
  on: 'font-bold text-fg-1',
  off: 'text-fg-4 hover:text-fg-1'
}
</script>

<template>
  <div class="relative flex gap-8 pb-3">
    <button
      v-for="o in options"
      ref="items"
      :key="o.value"
      class="text-16 transition-colors duration-150"
      :class="o.value === model ? TAB.on : TAB.off"
      @click="model = o.value"
    >
      {{ o.label }}
    </button>
    <i
      class="absolute bottom-0 left-0 h-[3px] w-6 rounded-[2px] bg-brand transition-transform duration-250 ease-out"
      :style="bar"
    />
  </div>
</template>
