<script setup lang="ts">
import { ref } from 'vue'
import type { FilterRow } from 'openhongguo'

/** 筛选面板：每行单选，空串 = 全部；选项多的行默认折叠成一行 */
const model = defineModel<Record<string, string>>({ required: true })
const { rows } = defineProps<{ rows: FilterRow[] }>()

const expanded = ref(new Set<string>())
const toggleExpand = (key: string): void => {
  const s = new Set(expanded.value)
  if (!s.delete(key)) s.add(key)
  expanded.value = s
}
const select = (key: string, value: string): void => {
  model.value = { ...model.value, [key]: value }
}

const OPT = 'h-7 rounded-14 px-3 text-13 transition-colors duration-150'
const OPT_ON = `${OPT} bg-brand/16 font-medium text-brand`
const OPT_OFF = `${OPT} text-fg-3b hover:text-fg-1`
</script>

<template>
  <div class="flex flex-col gap-2.5 rounded-16 bg-panel px-5 py-[18px]">
    <div v-for="row in rows" :key="row.key" class="flex items-start gap-4">
      <span class="w-10 flex-none text-13 leading-7 text-fg-4c">
        {{ row.name.replace(/^全部/, '') }}
      </span>
      <div
        class="flex flex-1 flex-wrap gap-x-1.5 gap-y-1 overflow-hidden"
        :class="expanded.has(row.key) ? 'max-h-none' : 'max-h-7'"
      >
        <button :class="model[row.key] ? OPT_OFF : OPT_ON" @click="select(row.key, '')">
          全部
        </button>
        <button
          v-for="o in row.options"
          :key="o.value"
          :class="model[row.key] === o.value ? OPT_ON : OPT_OFF"
          @click="select(row.key, o.value)"
        >
          {{ o.name }}
        </button>
      </div>
      <button
        v-if="row.options.length > 14"
        class="flex-none text-12 leading-7 text-fg-4b hover:text-fg-1"
        @click="toggleExpand(row.key)"
      >
        {{ expanded.has(row.key) ? '收起' : '更多' }}
      </button>
    </div>
  </div>
</template>
