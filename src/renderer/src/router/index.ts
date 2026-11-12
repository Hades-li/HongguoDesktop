import { createRouter, createWebHashHistory } from 'vue-router'
import { routes } from './routes'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    needsSeries?: boolean
  }
}

export const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to) => {
  if (to.meta.needsSeries && !to.query.series_id) return { name: 'home' }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - 红果短剧` : '红果短剧'
})
