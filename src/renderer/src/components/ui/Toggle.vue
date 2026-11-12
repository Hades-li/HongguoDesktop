<script setup lang="ts">
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <button
    class="group relative h-5 w-9 rounded-10 bg-track transition-colors duration-200 aria-checked:bg-brand"
    role="switch"
    :aria-checked="model"
    @click="model = !model"
  >
    <i
      class="absolute top-0.5 left-0.5 size-4 rounded-full bg-fg-1 transition-transform duration-200 ease-out group-aria-checked:translate-x-4"
    />
  </button>
</template>
