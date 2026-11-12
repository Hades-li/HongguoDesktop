<script setup lang="ts">
import { nextTick, onUnmounted, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import AppSidebar from '@renderer/components/layout/AppSidebar.vue'
import AppTopBar from '@renderer/components/layout/AppTopBar.vue'
import { useUiStore } from '@renderer/stores/ui'

const main = useTemplateRef('main')
const router = useRouter()
const ui = useUiStore()

onUnmounted(
  router.beforeEach((_to, from) => {
    if (main.value) ui.scrollPositions.set(from.fullPath, main.value.scrollTop)
  })
)

onUnmounted(
  router.afterEach(async (to, from) => {
    if (to.name !== from.name) return
    await nextTick()
    main.value?.scrollTo({ top: ui.scrollPositions.get(to.fullPath) ?? 0 })
  })
)

async function restoreScroll(): Promise<void> {
  await nextTick()
  main.value?.scrollTo({ top: ui.scrollPositions.get(router.currentRoute.value.fullPath) ?? 0 })
}
</script>

<template>
  <div class="flex h-full">
    <AppSidebar />
    <main ref="main" class="relative min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-8 pb-12">
      <div
        class="sticky top-0 z-20 -mx-8 bg-linear-[var(--color-app)_75%,rgba(14,14,18,0)] px-8 pt-5 pb-4 drag"
      >
        <AppTopBar />
      </div>
      <RouterView v-slot="{ Component, route }">
        <Transition name="page" mode="out-in" @enter="restoreScroll">
          <component :is="Component" :key="String(route.name)" class="mt-5" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>
