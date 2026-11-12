import { app, ipcMain } from 'electron'
import { join } from 'path'
import type { Client } from 'openhongguo'
import { OHG_METHODS, type IpcResult } from '@shared/ipc'

let clientPromise: Promise<Client> | undefined

function getClient(): Promise<Client> {
  clientPromise ??= import('openhongguo').then(({ createClient, fileProfileStore }) =>
    createClient({
      profile: fileProfileStore(join(app.getPath('userData'), 'anonymous.json'))
    })
  )
  clientPromise.catch(() => (clientPromise = undefined))
  return clientPromise
}

export function registerOhgHandlers(): void {
  for (const method of OHG_METHODS) {
    ipcMain.handle(`ohg:${method}`, async (_event, ...args): Promise<IpcResult<unknown>> => {
      try {
        const client = await getClient()
        const fn = client[method] as (...a: unknown[]) => Promise<unknown>
        return { ok: true, data: await fn.apply(client, args) }
      } catch (error) {
        const e = error as Partial<Record<'code' | 'message', string>> & {
          retryable?: boolean
          retryAfterMs?: number
        }
        return {
          ok: false,
          error: {
            code: e.code ?? 'UNKNOWN',
            message: e.message ?? String(error),
            retryable: e.retryable ?? false,
            retryAfterMs: e.retryAfterMs ?? 0
          }
        }
      }
    })
  }
}
