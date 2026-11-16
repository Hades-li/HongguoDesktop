import { createDecipheriv } from 'node:crypto'

/**
 * 非分片 MP4 的 CENC（cenc-aes-ctr）按字节区间解密。
 * loadCencMeta 读出 moov 得到每个样本的位置与 IV；decryptAt 对任意一段字节原地解密，
 * 并把 encv/enca 改回原始格式、sinf/senc/saio/saiz 改名为 free（大小不变，偏移不动），
 * 播放器看到的就是一个普通的未加密 MP4，Range 请求与拖动不受影响。
 */

type Fetcher = (url: string, range: string) => Promise<Response>

interface Sample {
  offset: number
  size: number
  iv: Buffer
  subs?: [clear: number, enc: number][]
}

export interface CencMeta {
  size: number
  key: Buffer
  patches: [offset: number, bytes: Buffer][]
  samples: Sample[]
}

interface Box {
  type: string
  start: number
  body: number
  end: number
}

function* boxes(b: Buffer, start: number, end: number): Generator<Box> {
  let p = start
  while (p + 8 <= end) {
    let size = b.readUInt32BE(p)
    let hdr = 8
    if (size === 1) [size, hdr] = [Number(b.readBigUInt64BE(p + 8)), 16]
    else if (size === 0) size = end - p
    if (size < hdr || p + size > end) return
    yield { type: b.toString('latin1', p + 4, p + 8), start: p, body: p + hdr, end: p + size }
    p += size
  }
}

const CONTAINERS = new Set(['trak', 'mdia', 'minf', 'stbl', 'sinf', 'schi'])
const HIDDEN = new Set(['sinf', 'senc', 'saio', 'saiz'])
const FREE = Buffer.from('free')

function parseTrak(m: Buffer, trak: Box, base: number, meta: CencMeta): void {
  const tk: Record<string, Box> = {}
  const walk = (s: number, e: number): void => {
    for (const x of boxes(m, s, e)) {
      if (HIDDEN.has(x.type)) meta.patches.push([base + x.start + 4, FREE])
      if (CONTAINERS.has(x.type)) walk(x.body, x.end)
      else if (x.type === 'stsd') walk(x.body + 8, x.end)
      else if (x.type === 'encv') walk(x.body + 78, (tk.entry = x).end)
      else if (x.type === 'enca') {
        const v = m.readUInt16BE(x.body + 8)
        walk(x.body + 28 + (v === 1 ? 16 : v === 2 ? 36 : 0), (tk.entry = x).end)
      } else tk[x.type] = x
    }
  }
  walk(trak.body, trak.end)

  const { entry, frma, schm, tenc, senc, stsz, stsc } = tk
  if (!entry) return
  const scheme = schm && m.toString('latin1', schm.body + 4, schm.body + 8)
  if (!frma || scheme !== 'cenc' || !tenc || !senc || !stsz || !stsc)
    throw new Error(`unsupported encryption: ${scheme ?? 'unknown'}`)
  meta.patches.push([base + entry.start + 4, Buffer.from(m.subarray(frma.body, frma.body + 4))])

  const ivSize = m[tenc.body + 7]
  if (!ivSize) throw new Error('constant IV is not supported')

  const co = tk.stco ?? tk.co64
  if (!co) throw new Error('missing chunk offsets')
  const wide = co.type === 'co64'
  const chunks = Array.from({ length: m.readUInt32BE(co.body + 4) }, (_, i) =>
    wide ? Number(m.readBigUInt64BE(co.body + 8 + i * 8)) : m.readUInt32BE(co.body + 8 + i * 4)
  )

  const fixed = m.readUInt32BE(stsz.body + 4)
  const count = m.readUInt32BE(stsz.body + 8)
  const subsamples = (m.readUInt32BE(senc.body) & 0xffffff & 2) !== 0
  let sp = senc.body + 8
  let si = 0
  const runs = m.readUInt32BE(stsc.body + 4)
  for (let r = 0; r < runs; r++) {
    const at = stsc.body + 8 + r * 12
    const first = m.readUInt32BE(at)
    const per = m.readUInt32BE(at + 4)
    const next = r + 1 < runs ? m.readUInt32BE(at + 12) : chunks.length + 1
    for (let c = first; c < next; c++) {
      let offset = chunks[c - 1]
      for (let k = 0; k < per && si < count; k++, si++) {
        const size = fixed || m.readUInt32BE(stsz.body + 12 + si * 4)
        const iv = Buffer.from(m.subarray(sp, (sp += ivSize)))
        let subs: Sample['subs']
        if (subsamples) {
          subs = Array.from({ length: m.readUInt16BE(sp) }, (_, j) => {
            const q = sp + 2 + j * 6
            return [m.readUInt16BE(q), m.readUInt32BE(q + 2)] as [number, number]
          })
          sp += 2 + subs.length * 6
        }
        meta.samples.push({ offset, size, iv, subs })
        offset += size
      }
    }
  }
}

/** 逐个读取顶层 box 直到 moov（faststart 文件一两次请求即可） */
export async function loadCencMeta(url: string, key: string, fetcher: Fetcher): Promise<CencMeta> {
  const CHUNK = 256 * 1024
  let buf = Buffer.alloc(0)
  let bufStart = 0
  let total = Infinity
  const read = async (from: number, to: number): Promise<void> => {
    const res = await fetcher(url, `bytes=${from}-${to}`)
    if (res.status !== 206) throw new Error(`media request failed: ${res.status}`)
    total = Number(res.headers.get('content-range')?.split('/')[1]) || total
    buf = Buffer.from(await res.arrayBuffer())
    bufStart = from
  }

  for (let pos = 0; pos < total;) {
    if (pos + 16 > bufStart + buf.length) await read(pos, pos + CHUNK - 1)
    const head = buf.subarray(pos - bufStart)
    const size32 = head.readUInt32BE(0)
    const size = size32 === 1 ? Number(head.readBigUInt64BE(8)) : size32 || total - pos
    if (head.toString('latin1', 4, 8) === 'moov') {
      if (pos + size > bufStart + buf.length) await read(pos, pos + size - 1)
      const m = buf.subarray(pos - bufStart, pos - bufStart + size)
      const meta: CencMeta = { size: total, key: Buffer.from(key, 'hex'), patches: [], samples: [] }
      for (const trak of boxes(m, 8, m.length))
        if (trak.type === 'trak') parseTrak(m, trak, pos, meta)
      meta.samples.sort((a, b) => a.offset - b.offset)
      return meta
    }
    if (size < 8) break
    pos += size
  }
  throw new Error('moov not found')
}

/** CENC 的 16 字节计数器：IV 右补零后按 128 位大端加上块序号 */
function counter(iv: Buffer, block: number): Buffer {
  const c = Buffer.alloc(16)
  iv.copy(c)
  for (let i = 15, carry = block; i >= 0 && carry; i--) {
    const v = c[i] + (carry % 256)
    c[i] = v & 255
    carry = Math.floor(carry / 256) + (v >> 8)
  }
  return c
}

function decryptSample(key: Buffer, s: Sample, chunk: Buffer, start: number): void {
  const end = start + chunk.length
  let pos = s.offset
  let enc = 0
  for (const [clear, n] of s.subs ?? [[0, s.size]]) {
    pos += clear
    const a = Math.max(pos, start)
    const b = Math.min(pos + n, end)
    if (a < b) {
      const e = enc + (a - pos)
      const d = createDecipheriv('aes-128-ctr', key, counter(s.iv, Math.floor(e / 16)))
      if (e % 16) d.update(Buffer.alloc(e % 16))
      d.update(chunk.subarray(a - start, b - start)).copy(chunk, a - start)
    }
    pos += n
    enc += n
  }
}

/** 对文件中从 start 起的一段字节原地解密并打补丁 */
export function decryptAt(meta: CencMeta, start: number, chunk: Buffer): void {
  const end = start + chunk.length
  for (const [off, bytes] of meta.patches)
    for (let i = 0; i < bytes.length; i++)
      if (off + i >= start && off + i < end) chunk[off + i - start] = bytes[i]

  const { samples } = meta
  let lo = 0
  let hi = samples.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (samples[mid].offset + samples[mid].size <= start) lo = mid + 1
    else hi = mid
  }
  for (let i = lo; i < samples.length && samples[i].offset < end; i++)
    decryptSample(meta.key, samples[i], chunk, start)
}
