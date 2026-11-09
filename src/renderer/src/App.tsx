import { useState } from 'react'
import { UpdateButton } from './UpdateButton'
import type { Episode, PlaybackResult, SeriesSummary } from 'openhongguo'

type IpcResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } }

function App(): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [series, setSeries] = useState<SeriesSummary[]>([])
  const [selected, setSelected] = useState<SeriesSummary>()
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [playback, setPlayback] = useState<PlaybackResult>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function run<T>(task: Promise<IpcResult<T>>): Promise<T | undefined> {
    setLoading(true)
    setError('')
    try {
      const result = await task
      if (!result.ok) {
        setError(`${result.error.code}: ${result.error.message}`)
        return undefined
      }
      return result.data
    } finally {
      setLoading(false)
    }
  }

  async function search(): Promise<void> {
    if (!query.trim()) return
    const page = await run(window.api.search(query.trim()))
    if (!page) return
    setSeries(page.items ?? [])
    setSelected(undefined)
    setEpisodes([])
    setPlayback(undefined)
  }

  async function selectSeries(item: SeriesSummary): Promise<void> {
    setSelected(item)
    setPlayback(undefined)
    const page = await run(window.api.listEpisodes(item.id))
    setEpisodes(page?.items ?? [])
  }

  async function selectEpisode(episode: Episode): Promise<void> {
    setPlayback(undefined)
    setPlayback(await run(window.api.resolvePlayback(episode.id)))
  }

  return (
    <div className="app">
      <div className="toolbar">
        <input
          value={query}
          placeholder="搜索短剧"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && search()}
        />
        <button disabled={loading} onClick={search}>
          搜索
        </button>
        <UpdateButton />
      </div>

      <div className="pane">
        {series.map((item) => (
          <div
            key={item.id}
            className={`series${selected?.id === item.id ? ' active' : ''}`}
            onClick={() => selectSeries(item)}
          >
            {item.cover_url && <img src={item.cover_url} alt="" />}
            <div className="meta">
              <strong>{item.title}</strong>
              <small>{item.episode_count ? `${item.episode_count} 集` : ''}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="pane">
        {error && <p className="error">{error}</p>}
        {selected && <h3>{selected.title}</h3>}
        <div className="episodes">
          {episodes.map((episode) => (
            <button
              key={episode.id}
              disabled={loading || !episode.playable}
              onClick={() => selectEpisode(episode)}
            >
              {episode.number}
            </button>
          ))}
        </div>
        {playback && (
          <div className="playback">
            <p>
              时长 {playback.playback.duration_seconds ?? '-'} 秒 ·{' '}
              {playback.playback.protected ? '加密 (cenc-aes-ctr)' : '未加密'}
            </p>
            {playback.contentKey && (
              <p>
                内容密钥：<code>{playback.contentKey.key}</code>
              </p>
            )}
            {playback.contentKeyError && (
              <p className="error">{playback.contentKeyError.message}</p>
            )}
            <ul>
              {playback.playback.streams.map((stream, index) => (
                <li key={index}>
                  {stream.definition} {stream.codec}{' '}
                  {stream.hls ? 'HLS' : stream.dash ? 'DASH' : ''}
                  <br />
                  {stream.url}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
