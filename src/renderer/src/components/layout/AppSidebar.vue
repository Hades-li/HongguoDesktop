<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRoute, type RouteLocationRaw } from 'vue-router'
import AppIcon from '@renderer/components/ui/AppIcon.vue'
import type { IconName } from '@renderer/components/ui/icons'
import { useFollowStore } from '@renderer/stores/follow'
import LogoMark from './LogoMark.vue'
import SidebarUpdateCard from './SidebarUpdateCard.vue'

interface NavItem {
  label: string
  icon: IconName
  to: RouteLocationRaw
  active: () => boolean
}

const route = useRoute()
const { updateCount } = storeToRefs(useFollowStore())

const genreNav = (genre: 'real' | 'comic' | 'ai', label: string): NavItem => ({
  label,
  icon: genre,
  to: { name: 'category', query: { genre } },
  active: () => route.name === 'category' && route.query.genre === genre
})

const groups: { title: string; items: NavItem[] }[] = [
  {
    title: '发现',
    items: [
      { label: '首页', icon: 'home', to: { name: 'home' }, active: () => route.name === 'home' },
      { label: '排行榜', icon: 'rank', to: '/rank', active: () => route.name === 'rank' },
      {
        label: '分类找剧',
        icon: 'category',
        to: { name: 'category' },
        active: () => route.name === 'category' && !route.query.genre
      },
      genreNav('real', '真人剧'),
      genreNav('comic', '漫剧'),
      genreNav('ai', 'AI 剧')
    ]
  },
  {
    title: '我的',
    items: [
      {
        label: '观看历史',
        icon: 'history',
        to: { name: 'history' },
        active: () => route.name === 'history'
      },
      {
        label: '我的追剧',
        icon: 'following',
        to: { name: 'following' },
        active: () => route.name === 'following'
      }
    ]
  }
]

const NAV = {
  on: 'bg-nav font-medium text-fg-1',
  off: 'text-fg-3 hover:bg-white/6 hover:text-fg-1'
}
</script>

<template>
  <aside
    class="flex w-sidebar flex-none flex-col gap-1 border-r border-white/6 bg-sidebar px-4 pt-4 pb-6"
  >
    <div class="flex items-center gap-2.5 px-2 pt-7 pb-5 text-18 font-bold text-fg-1 drag">
      <LogoMark />
      <span>红果短剧</span>
    </div>
    <nav v-for="g in groups" :key="g.title" class="flex flex-col gap-1 [&+&]:mt-5">
      <p class="px-1 pb-1 text-11 font-medium text-fg-5">{{ g.title }}</p>
      <RouterLink
        v-for="item in g.items"
        :key="item.label"
        :to="item.to"
        class="flex h-10 items-center gap-3 rounded-10 px-3 text-14 transition-colors duration-150"
        :class="item.active() ? NAV.on : NAV.off"
      >
        <AppIcon :name="item.icon" :class="item.active() ? 'text-brand' : 'text-icon-muted'" />
        <span class="flex-1">{{ item.label }}</span>
        <em
          v-if="item.icon === 'following' && updateCount"
          class="rounded-10 bg-brand px-[7px] py-px text-10 text-fg-1 not-italic"
        >
          {{ updateCount }} 更新
        </em>
      </RouterLink>
    </nav>
    <SidebarUpdateCard class="mt-auto" />
  </aside>
</template>
