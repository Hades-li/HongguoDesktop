<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { UpdateState } from '../../shared/update'

const api = window.api
const state = ref<UpdateState>({ phase: 'idle' })
let off: (() => void) | undefined

onMounted(() => {
  off = api.update.onChange((next) => (state.value = next))
  void api.update.state().then((next) => (state.value = next))
})

onUnmounted(() => off?.())

const percent = computed(() => {
  const current = state.value
  if (current.phase !== 'downloading' || current.total <= 0) return 0
  return Math.min(99, Math.floor((current.received / current.total) * 100))
})
</script>

<template>
  <button v-if="state.phase === 'available'" @click="api.update.download()">
    发现新版本 {{ state.version }}，点击下载
  </button>
  <button v-else-if="state.phase === 'downloading'" disabled>
    正在下载 {{ state.version }}（{{ percent }}%）
  </button>
  <button v-else-if="state.phase === 'ready'" @click="api.update.install()">
    {{ state.version }} 已下载，点击重启并安装
  </button>
  <button v-else-if="state.phase === 'installing'" disabled>正在安装 {{ state.version }}…</button>
  <button
    v-else-if="state.phase === 'error'"
    class="error"
    :title="state.message"
    @click="api.update.download()"
  >
    更新失败，点击重试
  </button>
</template>
