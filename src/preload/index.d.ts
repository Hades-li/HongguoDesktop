import { ElectronAPI } from '@electron-toolkit/preload'
import type { UpdateState } from '../shared/update'
import type { Episode, Page, PlaybackResult, SeriesSummary } from 'openhongguo'

type IpcResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } }

interface OhgApi {
  search: (query: string, cursor?: string) => Promise<IpcResult<Page<SeriesSummary>>>
  listEpisodes: (seriesId: string) => Promise<IpcResult<Page<Episode>>>
  resolvePlayback: (episodeId: string) => Promise<IpcResult<PlaybackResult>>
  resetDevice: () => Promise<IpcResult<void>>
  update: {
    state: () => Promise<UpdateState>
    download: () => Promise<void>
    install: () => Promise<void>
    onChange: (callback: (state: UpdateState) => void) => () => void
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: OhgApi
  }
}
