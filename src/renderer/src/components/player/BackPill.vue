<script setup lang="ts">
import AppIcon from '@renderer/components/ui/AppIcon.vue'

const emit = defineEmits<{ back: [] }>()
</script>

<template>
  <button
    class="inline-flex items-center gap-1.5 rounded-[18px] bg-white/12 py-2 pr-3.5 pl-2.5 text-13 font-medium text-fg-1 backdrop-blur-md transition-colors duration-150 no-drag hover:bg-white/25"
    @click="emit('back')"
  >
    <AppIcon name="back" :size="16" />
    返回详情
    <kbd class="ml-1 font-num text-11 text-fg-2c">Esc</kbd>
  </button>
</template>
