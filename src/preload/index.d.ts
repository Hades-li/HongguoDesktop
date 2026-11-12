import { ElectronAPI } from '@electron-toolkit/preload'
import type { OhgApi } from '../shared/ipc'
import type { UpdateState } from '../shared/update'

interface Api extends OhgApi {
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
    api: Api
  }
}
