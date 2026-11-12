import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface HistoryRecord {
  seriesId: string
  title: string
  cover: string
  epNumber: number
  episodeId: string
  positionSec: number
  durationSec: number
  totalEp: number
  updatedAt: number
}

export const useHistoryStore = defineStore(
  'history',
  () => {
    const records = ref<Record<string, HistoryRecord>>({})

    const list = computed(() =>
      Object.values(records.value).sort((a, b) => b.updatedAt - a.updatedAt)
    )

    function upsert(record: Omit<HistoryRecord, 'updatedAt'>): void {
      records.value[record.seriesId] = { ...record, updatedAt: Date.now() }
    }

    function remove(seriesId: string): void {
      delete records.value[seriesId]
    }

    function clear(): void {
      records.value = {}
    }

    return { records, list, upsert, remove, clear }
  },
  { persist: { key: 'hg:history' } }
)
