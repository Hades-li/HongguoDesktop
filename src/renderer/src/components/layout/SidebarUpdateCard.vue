<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUpdateStore } from '@renderer/stores/update'

const store = useUpdateStore()
const { state, percent } = storeToRefs(store)

const TITLE = 'text-13 font-medium text-fg-1'
const SUB = 'text-12 text-brand-soft'
</script>

<template>
  <Transition name="fade">
    <button
      v-if="state.phase !== 'idle'"
      class="relative flex flex-col gap-1 overflow-hidden rounded-12 border border-[rgba(255,46,84,0.5)] bg-[#16161c] p-3.5 text-left"
      :disabled="state.phase === 'downloading' || state.phase === 'installing'"
      @click="state.phase === 'ready' ? store.install() : store.download()"
    >
      <template v-if="state.phase === 'available'">
        <strong :class="TITLE">新版本 v{{ state.version }} 可用</strong>
        <span :class="SUB">点击下载更新 →</span>
      </template>
      <template v-else-if="state.phase === 'downloading'">
        <strong :class="TITLE">正在下载 v{{ state.version }}</strong>
        <span :class="SUB">{{ percent }}%</span>
        <i
          class="absolute bottom-0 left-0 h-0.5 bg-brand transition-[width] duration-300"
          :style="{ width: `${percent}%` }"
        />
      </template>
      <template v-else-if="state.phase === 'ready'">
        <strong :class="TITLE">新版本 v{{ state.version }} 可用</strong>
        <span :class="SUB">重启即可完成更新 →</span>
      </template>
      <template v-else-if="state.phase === 'installing'">
        <strong :class="TITLE">正在安装 v{{ state.version }}</strong>
        <span :class="SUB">请稍候…</span>
      </template>
      <template v-else>
        <strong :class="TITLE">更新失败</strong>
        <span :class="SUB" :title="state.message">点击重试 →</span>
      </template>
    </button>
  </Transition>
</template>
