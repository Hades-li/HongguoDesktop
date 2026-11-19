import { app, ipcMain } from 'electron'
import { appendFile, mkdir } from 'node:fs/promises'
import { join } from 'path'
import type { Client, PlaybackResult } from 'openhongguo'
import { OHG_METHODS, type IpcResult } from '@shared/ipc'
import { proxyPlayback } from './media'

let clientPromise: Promise<Client> | undefined

/** SDK 的请求日志与调用失败追加到 userData/logs/ohg.log；失败同时打到终端 */
let logDir: Promise<unknown> | undefined
function log(line: string, loud = false): void {
  const text = `${new Date().toISOString()} ${line}`
  if (loud) console.error(`[ohg] ${text}`)
  const dir = join(app.getPath('userData'), 'logs')
  logDir ??= mkdir(dir, { recursive: true })
  void logDir.then(() => appendFile(join(dir, 'ohg.log'), text + '\n')).catch(() => undefined)
}

/**
 * 内置签名失效时（如 App 升级后签名算法变化），可设 OHG_SIGNER_URL / OHG_SIGNER_TOKEN
 * 改用 openhongguo-signer 签名服务；与官方 CLI 同名。签名服务不可用时报 SIGNER_UNAVAILABLE。
 */
const signerUrl = process.env.OHG_SIGNER_URL || undefined
const signerToken = process.env.OHG_SIGNER_TOKEN || undefined

function getClient(): Promise<Client> {
  clientPromise ??= import('openhongguo').then(({ createClient, fileProfileStore }) => {
    if (signerUrl) log(`using signer service ${signerUrl}`)
    return createClient({
      // 签名服务用单独的设备档案，免得与内置签名的档案互相覆盖
      profile: fileProfileStore(
        join(app.getPath('userData'), signerUrl ? 'anonymous-signer.json' : 'anonymous.json')
      ),
      log: (line) => log(line, !/-> 2\d\d$/.test(line)),
      signerUrl,
      signerToken
    })
  })
  clientPromise.catch(() => (clientPromise = undefined))
  return clientPromise
}

/**
 * 新注册的匿名设备首个播放请求偶尔返回空结果；SDK 换设备（deviceResets）全部落空时
 * 报 ANONYMOUS_LIMITED，稍等再请求通常即可成功（2026-11-16 实测 48 次中 1 次，重试即恢复）
 */
const PLAYBACK_RETRIES = [800, 2000]

async function invoke(client: Client, method: string, args: unknown[]): Promise<unknown> {
  const fn = client[method as keyof Client] as (...a: unknown[]) => Promise<unknown>
  for (const delay of method === 'resolvePlayback' ? PLAYBACK_RETRIES : []) {
    try {
      return await fn.apply(client, args)
    } catch (e) {
      if ((e as { code?: string }).code !== 'ANONYMOUS_LIMITED') throw e
      log(`retry ${method} in ${delay}ms after ANONYMOUS_LIMITED`, true)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  return fn.apply(client, args)
}

export function registerOhgHandlers(): void {
  for (const method of OHG_METHODS) {
    ipcMain.handle(`ohg:${method}`, async (_event, ...args): Promise<IpcResult<unknown>> => {
      try {
        const data = await invoke(await getClient(), method, args)
        return {
          ok: true,
          data: method === 'resolvePlayback' ? proxyPlayback(data as PlaybackResult) : data
        }
      } catch (error) {
        const e = error as Partial<Record<'code' | 'message', string>> & {
          retryable?: boolean
          retryAfterMs?: number
        }
        log(
          `FAIL ${method} ${JSON.stringify(args)} ${e.code ?? 'UNKNOWN'}: ${e.message ?? error}`,
          true
        )
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
