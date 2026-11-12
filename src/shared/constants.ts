/** 排行榜四类 Tab（路由 /rank/:type）→ shortRank 的 content 与 board（已用 SDK 实测确认） */
export const RANK_TYPES = {
  'hot-drama': {
    label: '热播短剧',
    content: 'all',
    boards: { hot: 'ranklist_hot_play_sc', rec: 'ranklist_hot_sc', new: 'ranklist_new_rank_sc' }
  },
  real: {
    label: '热播真人剧',
    content: 'human',
    boards: { hot: 'human_hot_play', rec: 'human_hot_sc', new: 'human_new_rank' }
  },
  comic: {
    label: '热播漫剧',
    content: 'comic_series_rank',
    boards: {
      hot: 'comic_series_hot_play',
      rec: 'comic_series_hot_rank',
      new: 'comic_series_new_rank'
    }
  },
  ai: {
    label: '热播 AI 剧',
    content: 'ai_playlet',
    boards: { hot: 'ai_playlet_hot_play', rec: 'ai_playlet_hot_sc', new: 'ai_playlet_new_rank' }
  }
} as const

export type RankType = keyof typeof RANK_TYPES
export type RankBoardKey = keyof (typeof RANK_TYPES)[RankType]['boards']

export const RANK_BOARDS: { value: RankBoardKey; label: string }[] = [
  { value: 'hot', label: '热播榜' },
  { value: 'rec', label: '推荐榜' },
  { value: 'new', label: '新剧榜' }
]

/** 侧栏「真人剧 / 漫剧 / AI 剧」→ shortFilter 的 genre */
export const GENRES = {
  real: { label: '真人剧', genre: 'short_play' },
  comic: { label: '漫剧', genre: 'comic_series' },
  ai: { label: 'AI 剧', genre: 'ai_series' }
} as const

export type GenreKey = keyof typeof GENRES

/** 选集分区大小：详情页 50 / 播放页抽屉 30 */
export const RANGE_SIZE = { detail: 50, drawer: 30 } as const

export const TTL = { list: 5 * 60_000, detail: 10 * 60_000 } as const
