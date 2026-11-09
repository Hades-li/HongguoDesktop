import { app, ipcMain } from 'electron'
import { join } from 'path'
import type { Client } from 'openhongguo'

type IpcResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } }

let clientPromise: Promise<Client> | undefined

function getClient(): Promise<Client> {
  clientPromise ??= import('openhongguo').then(({ createClient, fileProfileStore }) =>
    createClient({
      profile: fileProfileStore(join(app.getPath('userData'), 'anonymous.json'))
    })
  )
  clientPromise.catch(() => {
    clientPromise = undefined
  })
  return clientPromise
}

function handle<Args extends unknown[], T>(
  channel: string,
  fn: (client: Client, ...args: Args) => Promise<T>
): void {
  ipcMain.handle(channel, async (_event, ...args): Promise<IpcResult<T>> => {
    try {
      return { ok: true, data: await fn(await getClient(), ...(args as Args)) }
    } catch (error) {
      const { code, message } = error as { code?: string; message?: string }
      return { ok: false, error: { code: code ?? 'UNKNOWN', message: message ?? String(error) } }
    }
  })
}

export function registerOhgHandlers(): void {
  handle('ohg:search', (client, query: string, cursor?: string) =>
    client.search(query, cursor ? { cursor } : {})
  )
  handle('ohg:episodes', (client, seriesId: string) => client.listEpisodes(seriesId))
  handle('ohg:playback', (client, episodeId: string) => client.resolvePlayback(episodeId))
  handle('ohg:reset-device', (client) => client.resetDevice())
}
