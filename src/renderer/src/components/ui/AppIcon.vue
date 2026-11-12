<script setup lang="ts">
import { ICONS, type IconName } from './icons'

const { name, size = 18 } = defineProps<{ name: IconName; size?: number }>()
</script>

<template>
  <svg
    :width="size"
    :height="size"
    :viewBox="`0 0 ${ICONS[name].box} ${ICONS[name].box}`"
    aria-hidden="true"
    class="block flex-none"
  >
    <component :is="tag" v-for="([tag, attrs], i) in ICONS[name].els" :key="i" v-bind="attrs" />
  </svg>
</template>
