import type { Client } from 'openhongguo'

/** 暴露给渲染进程的 SDK 方法；通道名为 `ohg:<method>`，参数与返回值直接沿用 SDK 类型 */
export const OHG_METHODS = [
  'discover',
  'search',
  'suggest',
  'hotSearch',
  'searchCues',
  'getSeries',
  'getSeriesBatch',
  'listEpisodes',
  'seriesRecommend',
  'shortRank',
  'shortFilterPanel',
  'shortFilter',
  'resolvePlayback',
  'resetDevice'
] as const

export type OhgMethod = (typeof OHG_METHODS)[number]

export interface IpcError {
  code: string
  message: string
  retryable: boolean
  retryAfterMs: number
}

export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: IpcError }

export type OhgData<K extends OhgMethod> = Awaited<ReturnType<Client[K]>>

export type OhgApi = {
  [K in OhgMethod]: (...args: Parameters<Client[K]>) => Promise<IpcResult<OhgData<K>>>
}
