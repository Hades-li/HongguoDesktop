import { ref, shallowRef } from 'vue'

interface PageLike<T> {
  items: T[]
  has_more: boolean
  cursor?: string
}

/** 游标分页列表：并发保护、按 id 去重、reset 后丢弃过期响应 */
export function usePaged<T extends { id: string }>(
  fetch: (cursor?: string) => Promise<PageLike<T>>
) {
  const items = shallowRef<T[]>([])
  const loading = ref(false)
  const error = shallowRef<unknown>()
  const hasMore = ref(true)
  let cursor: string | undefined
  let token = 0

  async function load(): Promise<void> {
    if (loading.value || !hasMore.value || error.value) return
    const t = token
    loading.value = true
    try {
      const page = await fetch(cursor)
      if (t !== token) return
      const seen = new Set(items.value.map((i) => i.id))
      items.value = [...items.value, ...page.items.filter((i) => i.id && !seen.has(i.id))]
      cursor = page.cursor
      hasMore.value = page.has_more && !!page.cursor
    } catch (e) {
      if (t === token) error.value = e
    } finally {
      if (t === token) loading.value = false
    }
  }

  function reset(): Promise<void> {
    token++
    items.value = []
    cursor = undefined
    hasMore.value = true
    error.value = undefined
    loading.value = false
    return load()
  }

  function retry(): Promise<void> {
    error.value = undefined
    return load()
  }

  return { items, loading, error, hasMore, load, reset, retry }
}
