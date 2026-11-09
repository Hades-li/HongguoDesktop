<script setup lang="ts">
import { ref } from 'vue'
import type { Episode, PlaybackResult, SeriesSummary } from 'openhongguo'
import UpdateButton from './UpdateButton.vue'

type IpcResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } }

const query = ref('')
const series = ref<SeriesSummary[]>([])
const selected = ref<SeriesSummary>()
const episodes = ref<Episode[]>([])
const playback = ref<PlaybackResult>()
const loading = ref(false)
const error = ref('')

async function run<T>(task: Promise<IpcResult<T>>): Promise<T | undefined> {
  loading.value = true
  error.value = ''
  try {
    const result = await task
    if (!result.ok) {
      error.value = `${result.error.code}: ${result.error.message}`
      return undefined
    }
    return result.data
  } finally {
    loading.value = false
  }
}

async function search(): Promise<void> {
  const text = query.value.trim()
  if (!text) return
  const page = await run(window.api.search(text))
  if (!page) return
  series.value = page.items ?? []
  selected.value = undefined
  episodes.value = []
  playback.value = undefined
}

async function selectSeries(item: SeriesSummary): Promise<void> {
  selected.value = item
  playback.value = undefined
  const page = await run(window.api.listEpisodes(item.id))
  episodes.value = page?.items ?? []
}

async function selectEpisode(episode: Episode): Promise<void> {
  playback.value = undefined
  playback.value = await run(window.api.resolvePlayback(episode.id))
}
</script>

<template>
  <div class="app">
    <div class="toolbar">
      <input v-model="query" placeholder="搜索短剧" @keydown.enter="search" />
      <button :disabled="loading" @click="search">搜索</button>
      <UpdateButton />
    </div>

    <div class="pane">
      <div
        v-for="item in series"
        :key="item.id"
        :class="['series', { active: selected?.id === item.id }]"
        @click="selectSeries(item)"
      >
        <img v-if="item.cover_url" :src="item.cover_url" alt="" />
        <div class="meta">
          <strong>{{ item.title }}</strong>
          <small>{{ item.episode_count ? `${item.episode_count} 集` : '' }}</small>
        </div>
      </div>
    </div>

    <div class="pane">
      <p v-if="error" class="error">{{ error }}</p>
      <h3 v-if="selected">{{ selected.title }}</h3>
      <div class="episodes">
        <button
          v-for="episode in episodes"
          :key="episode.id"
          :disabled="loading || !episode.playable"
          @click="selectEpisode(episode)"
        >
          {{ episode.number }}
        </button>
      </div>
      <div v-if="playback" class="playback">
        <p>
          时长 {{ playback.playback.duration_seconds ?? '-' }} 秒 ·
          {{ playback.playback.protected ? '加密 (cenc-aes-ctr)' : '未加密' }}
        </p>
        <p v-if="playback.contentKey">
          内容密钥：<code>{{ playback.contentKey.key }}</code>
        </p>
        <p v-if="playback.contentKeyError" class="error">{{ playback.contentKeyError.message }}</p>
        <ul>
          <li v-for="(stream, index) in playback.playback.streams" :key="index">
            {{ stream.definition }} {{ stream.codec }}
            {{ stream.hls ? 'HLS' : stream.dash ? 'DASH' : '' }}
            <br />
            {{ stream.url }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
