import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { OHG_METHODS, type OhgApi } from '@shared/ipc'
import type { UpdateState } from '@shared/update'

const ohg = Object.fromEntries(
  OHG_METHODS.map((method) => [
    method,
    (...args: unknown[]) => ipcRenderer.invoke(`ohg:${method}`, ...args)
  ])
) as OhgApi

const api = {
  ...ohg,
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
