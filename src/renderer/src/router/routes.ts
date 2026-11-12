import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@renderer/layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('@renderer/views/HomeView.vue') },
      { path: 'rank', redirect: '/rank/hot-drama' },
      {
        path: 'rank/:type(hot-drama|real|comic|ai)',
        name: 'rank',
        component: () => import('@renderer/views/RankView.vue'),
        props: true,
        meta: { title: '排行榜' }
      },
      {
        path: 'detail',
        name: 'detail',
        component: () => import('@renderer/views/DetailView.vue'),
        meta: { needsSeries: true }
      },
      {
        path: 'category',
        name: 'category',
        component: () => import('@renderer/views/CategoryView.vue'),
        meta: { title: '分类找剧' }
      },
      {
        path: 'search',
        name: 'search',
        component: () => import('@renderer/views/SearchView.vue'),
        meta: { title: '搜索' }
      },
      {
        path: 'history',
        name: 'history',
        component: () => import('@renderer/views/HistoryView.vue'),
        meta: { title: '观看历史' }
      },
      {
        path: 'following',
        name: 'following',
        component: () => import('@renderer/views/FollowingView.vue'),
        meta: { title: '我的追剧' }
      }
    ]
  },
  {
    path: '/play',
    component: () => import('@renderer/layouts/PlayerLayout.vue'),
    children: [
      {
        path: '',
        name: 'play',
        component: () => import('@renderer/views/PlayView.vue'),
        meta: { needsSeries: true }
      }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]
