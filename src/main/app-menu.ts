import { type BrowserWindow, type MenuItemConstructorOptions, Menu, app, dialog } from 'electron'
import type { Updater } from './updater/updater'

type MessageBoxOptions = Parameters<typeof dialog.showMessageBox>[0]

let checking = false

async function show(parent: BrowserWindow | null, options: MessageBoxOptions): Promise<number> {
  const { response } = parent
    ? await dialog.showMessageBox(parent, options)
    : await dialog.showMessageBox(options)
  return response
}

async function checkForUpdates(
  updater: Updater | null,
  parent: BrowserWindow | null
): Promise<void> {
  if (!updater) {
    await show(parent, { type: 'info', message: '当前版本不支持检查更新' })
    return
  }
  if (checking) return
  checking = true
  try {
    await updater.check()
  } catch (error) {
    await show(parent, {
      type: 'error',
      message: '检查更新失败',
      detail: error instanceof Error ? error.message : String(error)
    })
    return
  } finally {
    checking = false
  }

  const state = updater.state
  switch (state.phase) {
    case 'idle':
      await show(parent, {
        type: 'info',
        message: '已是最新版本',
        detail: `当前版本 ${app.getVersion()}`
      })
      return
    case 'available':
    case 'error': {
      const response = await show(parent, {
        type: 'info',
        message: `发现新版本 ${state.version}`,
        detail: `当前版本 ${app.getVersion()}，是否立即下载？`,
        buttons: ['立即下载', '取消'],
        defaultId: 0,
        cancelId: 1
      })
      if (response === 0) void updater.download()
      return
    }
    case 'ready': {
      const response = await show(parent, {
        type: 'info',
        message: `新版本 ${state.version} 已下载完成`,
        detail: '是否立即重启并安装？',
        buttons: ['重启并安装', '稍后'],
        defaultId: 0,
        cancelId: 1
      })
      if (response === 0) void updater.install()
      return
    }
    default:
      await show(parent, { type: 'info', message: `新版本 ${state.version} 正在更新中` })
  }
}

export function installAppMenu(updater: Updater | null, window: () => BrowserWindow | null): void {
  const checkItem: MenuItemConstructorOptions = {
    label: '检查更新…',
    click: () => void checkForUpdates(updater, window())
  }
  const template: MenuItemConstructorOptions[] =
    process.platform === 'darwin'
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              checkItem,
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' }
            ]
          },
          { role: 'fileMenu' },
          { role: 'editMenu' },
          { role: 'viewMenu' },
          { role: 'windowMenu' }
        ]
      : [
          { role: 'fileMenu' },
          { role: 'editMenu' },
          { role: 'viewMenu' },
          { role: 'windowMenu' },
          { role: 'help', submenu: [checkItem] }
        ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
