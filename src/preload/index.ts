import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { UpdateState } from '../shared/update'

const api = {
  search: (query: string, cursor?: string) => ipcRenderer.invoke('ohg:search', query, cursor),
  listEpisodes: (seriesId: string) => ipcRenderer.invoke('ohg:episodes', seriesId),
  resolvePlayback: (episodeId: string) => ipcRenderer.invoke('ohg:playback', episodeId),
  resetDevice: () => ipcRenderer.invoke('ohg:reset-device'),
  update: {
    state: (): Promise<UpdateState> => ipcRenderer.invoke('update:get'),
    download: (): Promise<void> => ipcRenderer.invoke('update:download'),
    install: (): Promise<void> => ipcRenderer.invoke('update:install'),
    onChange: (callback: (state: UpdateState) => void): (() => void) => {
      const listener = (_event: unknown, state: UpdateState): void => callback(state)
      ipcRenderer.on('update:changed', listener)
      return () => ipcRenderer.removeListener('update:changed', listener)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
