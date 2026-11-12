<script setup lang="ts" generic="T extends string">
const model = defineModel<T>({ required: true })
const { options, block = false } = defineProps<{
  options: { value: T; label: string }[]
  block?: boolean
}>()

const ITEM = {
  on: 'bg-tile-hover font-medium text-fg-1',
  off: 'text-fg-4 hover:text-fg-1'
}
</script>

<template>
  <div class="rounded-10 p-[3px]" :class="block ? 'flex h-9 bg-card-2' : 'inline-flex bg-card'">
    <button
      v-for="o in options"
      :key="o.value"
      class="rounded-8 text-13 transition-colors duration-150"
      :class="[block ? 'flex-1' : 'px-4 py-1.5', o.value === model ? ITEM.on : ITEM.off]"
      @click="model = o.value"
    >
      {{ o.label }}
    </button>
  </div>
</template>
