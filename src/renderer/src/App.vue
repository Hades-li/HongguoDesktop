<script setup lang="ts">
import { onMounted } from 'vue'
import SearchOverlay from '@renderer/components/search/SearchOverlay.vue'
import ToastHost from '@renderer/components/ui/ToastHost.vue'
import { useGlobalHotkeys } from '@renderer/composables/useHotkeys'
import { useFollowStore } from '@renderer/stores/follow'

useGlobalHotkeys()
onMounted(useFollowStore().refresh)
</script>

<template>
  <RouterView />
  <SearchOverlay />
  <ToastHost />
</template>
