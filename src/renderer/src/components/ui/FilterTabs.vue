<script setup lang="ts" generic="T extends string">
const model = defineModel<T>({ required: true })
const { options } = defineProps<{ options: { value: T; label: string }[] }>()

const TAB = {
  on: 'bg-fg-1 text-app',
  off: 'bg-card text-fg-3b hover:text-fg-1'
}
</script>

<template>
  <div class="flex gap-2">
    <button
      v-for="o in options"
      :key="o.value"
      class="rounded-14 px-3 py-[5px] text-12 font-medium transition-colors duration-150"
      :class="o.value === model ? TAB.on : TAB.off"
      @click="model = o.value"
    >
      {{ o.label }}
    </button>
  </div>
</template>
