import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { app, ipcMain, net } from 'electron'
import type { UpdateState } from '../../shared/update'
import { installUpdate } from './install'
import { feedFromAppUpdateConfig, staticFeed, type UpdateFeed } from './manifest'
import { Updater } from './updater'

const FIRST_CHECK_DELAY_MS = 10_000
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000

function resolveFeed(): UpdateFeed | null {
  const override = process.env.HONGGUO_UPDATE_URL
  if (override) return staticFeed(override)
  if (!app.isPackaged) return null
  try {
    return feedFromAppUpdateConfig(
      readFileSync(join(process.resourcesPath, 'app-update.yml'), 'utf-8')
    )
  } catch {
    return null
  }
}

export function createUpdater(publish: (state: UpdateState) => void): Updater | null {
  const feed = resolveFeed()
  if (!feed) return null
  const updater = new Updater({
    feed,
    platform: process.platform,
    arch: process.arch,
    currentVersion: app.getVersion(),
    workDir: join(app.getPath('userData'), 'updates'),
    fetch: (url, init) => net.fetch(url, init),
    publish,
    install: installUpdate
  })
  return updater.supported ? updater : null
}

export function scheduleUpdateChecks(updater: Updater): void {
  const check = (): void => {
    updater.check().catch((error) => console.warn('[updater] check failed:', error))
  }
  setTimeout(() => {
    void updater.cleanup().then(check)
    setInterval(check, CHECK_INTERVAL_MS).unref()
  }, FIRST_CHECK_DELAY_MS).unref()
}

export function registerUpdateHandlers(updater: Updater | null): void {
  ipcMain.handle('update:get', (): UpdateState => updater?.state ?? { phase: 'idle' })
  ipcMain.handle('update:download', () => updater?.download())
  ipcMain.handle('update:install', () => updater?.install())
}
