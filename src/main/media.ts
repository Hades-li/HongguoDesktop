import { net, protocol } from 'electron'
import { randomUUID } from 'node:crypto'
import type { PlaybackResult } from 'openhongguo'
import { MEDIA_SCHEME } from '@shared/constants'
import { decryptAt, loadCencMeta, type CencMeta } from './cenc'

/**
 * 加密分集的本地解密代理：resolvePlayback 后把加密流地址换成 `ohg-media://<id>`，
 * <video> 请求它时主进程按 Range 转发到 CDN，边收边解密。密钥只留在主进程。
 */

interface Entry {
  url: string
  key: string
  meta?: Promise<CencMeta>
}

const MAX_ENTRIES = 32
const entries = new Map<string, Entry>()

const fetchRange = (url: string, range: string): Promise<Response> =>
  net.fetch(url, { headers: { Range: range } })

/** 必须在 app ready 之前调用 */
export function registerMediaScheme(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: MEDIA_SCHEME, privileges: { standard: true, secure: true, stream: true } }
  ])
}

/** 把加密流换成代理地址，并去掉 contentKey */
export function proxyPlayback({ contentKey, ...rest }: PlaybackResult): PlaybackResult {
  if (!contentKey) return rest
  const streams = rest.playback.streams.map((s) => {
    if (!s.protected || !s.url || s.dash) return s
    const id = randomUUID()
    entries.set(id, { url: s.url, key: contentKey.key })
    return { ...s, url: `${MEDIA_SCHEME}://${id}/`, backup_url: undefined }
  })
  for (const id of entries.keys()) {
    if (entries.size <= MAX_ENTRIES) break
    entries.delete(id)
  }
  return { ...rest, playback: { ...rest.playback, streams } }
}

async function handle(req: Request): Promise<Response> {
  const entry = entries.get(new URL(req.url).hostname)
  if (!entry) return new Response(null, { status: 404 })

  entry.meta ??= loadCencMeta(entry.url, entry.key, fetchRange)
  let meta: CencMeta
  try {
    meta = await entry.meta
  } catch {
    entry.meta = undefined
    return new Response(null, { status: 502 })
  }

  const [, a = '', b = ''] = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') ?? '') ?? []
  const last = meta.size - 1
  const start = a ? Number(a) : b ? Math.max(0, meta.size - Number(b)) : 0
  const end = a && b ? Math.min(Number(b), last) : last
  if (start > end) return new Response(null, { status: 416 })

  const upstream = await fetchRange(entry.url, `bytes=${start}-${end}`)
  if (upstream.status !== 206 || !upstream.body)
    return new Response(null, { status: upstream.status || 502 })

  let pos = start
  const body = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, ctl) {
        const buf = Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength)
        decryptAt(meta, pos, buf)
        pos += buf.length
        ctl.enqueue(buf)
      }
    })
  )
  return new Response(body, {
    status: 206,
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': String(end - start + 1),
      'Content-Range': `bytes ${start}-${end}/${meta.size}`,
      'Accept-Ranges': 'bytes'
    }
  })
}

export function registerMediaProtocol(): void {
  protocol.handle(MEDIA_SCHEME, handle)
}
