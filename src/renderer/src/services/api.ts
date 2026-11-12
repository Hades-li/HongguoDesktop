import type { IpcError, IpcResult, OhgApi, OhgData, OhgMethod } from '@shared/ipc'

export class ApiError extends Error {
  readonly code: string
  readonly retryable: boolean
  readonly retryAfterMs: number

  constructor(error: IpcError) {
    super(error.message)
    this.name = 'ApiError'
    this.code = error.code
    this.retryable = error.retryable
    this.retryAfterMs = error.retryAfterMs
  }
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/** 调用 main 进程的 SDK 方法；解包 IpcResult，可重试错误按 retryAfterMs 自动重试一次 */
export async function call<K extends OhgMethod>(
  method: K,
  ...args: Parameters<OhgApi[K]>
): Promise<OhgData<K>> {
  const invoke = window.api[method] as (...a: unknown[]) => Promise<IpcResult<OhgData<K>>>
  let result = await invoke(...args)
  if (!result.ok && result.error.retryable) {
    await sleep(Math.min(result.error.retryAfterMs || 800, 5000))
    result = await invoke(...args)
  }
  if (result.ok) return result.data
  throw new ApiError(result.error)
}

const MESSAGES: Record<string, string> = {
  ANONYMOUS_LIMITED: '匿名设备暂无该集的播放权限',
  DRM_PROTECTED: '该集为加密内容，暂不支持播放',
  CONTENT_UNAVAILABLE: '内容已下架或暂不可用',
  RATE_LIMITED: '请求太频繁，请稍后再试',
  TRANSPORT: '网络异常，请检查网络连接',
  DEVICE_REJECTED: '设备校验失败，请重试'
}

export function errorText(error: unknown): string {
  if (error instanceof ApiError) return MESSAGES[error.code] ?? error.message
  return error instanceof Error ? error.message : String(error)
}
