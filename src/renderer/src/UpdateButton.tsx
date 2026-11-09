import { useEffect, useState } from 'react'
import type { UpdateState } from '../../shared/update'

export function UpdateButton(): React.JSX.Element | null {
  const [state, setState] = useState<UpdateState>({ phase: 'idle' })

  useEffect(() => {
    const off = window.api.update.onChange(setState)
    void window.api.update.state().then(setState)
    return off
  }, [])

  switch (state.phase) {
    case 'idle':
      return null
    case 'available':
      return (
        <button onClick={() => void window.api.update.download()}>
          发现新版本 {state.version}，点击下载
        </button>
      )
    case 'downloading': {
      const percent =
        state.total > 0 ? Math.min(99, Math.floor((state.received / state.total) * 100)) : 0
      return (
        <button disabled>
          正在下载 {state.version}（{percent}%）
        </button>
      )
    }
    case 'ready':
      return (
        <button onClick={() => void window.api.update.install()}>
          {state.version} 已下载，点击重启并安装
        </button>
      )
    case 'installing':
      return <button disabled>正在安装 {state.version}…</button>
    case 'error':
      return (
        <button
          className="error"
          title={state.message}
          onClick={() => void window.api.update.download()}
        >
          更新失败，点击重试
        </button>
      )
  }
}
