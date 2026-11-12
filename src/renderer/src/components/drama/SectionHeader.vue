<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

const { title, more, to } = defineProps<{ title: string; more?: string; to?: RouteLocationRaw }>()
</script>

<template>
  <header class="mb-4 flex items-center gap-4">
    <h2 class="text-20 font-bold text-fg-1">{{ title }}</h2>
    <slot />
    <RouterLink v-if="more && to" :to="to" class="ml-auto more-link">{{ more }} →</RouterLink>
  </header>
</template>
