# HongguoDesktop UI 重构开发文档

> 分支：`v0.2.1`　基线：`main (v0.0.2)`
> 设计稿：<https://ardot.tencent.com/file/745901515002612>（本文所有数值均通过 Ardot MCP 从源文件节点读取）
> 更新日期：2026-11-11

---

## 1. 目标与范围

把当前"搜索 → 选集 → 取播放地址"的调试型界面，重构为设计稿定义的完整桌面客户端：

| 画板 | 节点 | 页面 | 路由 | 关键模块 |
|---|---|---|---|---|
| 01 | `3:15` | 首页 · 发现 | `/` | Hero 轮播、继续观看、热播短剧（分类 Tab）、本周热度榜 TOP5 |
| 04 | `3:596` | 排行榜 | `/rank/:type` | 四类 Tab、日/周/新剧榜分段、TOP3 领奖台、RankRow 列表（无限滚动） |
| 02 | `3:203` | 剧集详情 | `/detail?series_id=` | 毛玻璃 Hero、主按钮（历史感知）、选集网格（分区）、相关推荐 |
| 03 | `3:477` | 播放页 · 竖屏 | `/play?series_id=&ep=` | 9:16 沉浸播放、右侧选集抽屉、下一集预告、自动连播、快捷键 |
| 03b | `16:1` | 播放页 · 横屏 | 同上（按片源宽高比自动切换） | 16:9 大画面、底部信息栏、更多横屏好剧、影院模式 |
| 05 | `3:852` | 交互规范 | — | 路由流转、全局快捷键、转场、骨架屏 |
| 06 | `17:1` | 应用图标 | — | 替换 `build/icon.*` 与 `resources/icon.png`（本期可选） |

组件母版：`DramaCard 3:9`、`EpTile 3:558`、`RankRow 3:834`。

**明确不做**：登录 / VIP / 付费 / 评论 / 弹幕。「观看历史」「我的追剧」只存本地。设计稿侧栏没有用户/登录入口。

技术约束（本次需求指定）：

- 状态管理：**Pinia 最新版**（当前 npm latest `4.1.0`）
- 路由：**vue-router 最新版**（当前 npm latest `5.5.0`）

---

## 2. 设计稿解读

### 2.1 全局布局

```
┌─────────────┬──────────────────────────────────────────────┐
│  Sidebar    │  Main (V, gap 36, padding 20 32 48 32)        │
│  220px      │  ┌ TopBar h40: ‹ › | 🔍 420×40 ⌘K | 热搜… ┐  │
│  常驻        │  │ RouterView（内容区，内部滚动）            │  │
│  (播放页隐藏) │  └──────────────────────────────────────────┘  │
└─────────────┴──────────────────────────────────────────────┘
```

- 设计基准 **1440 × 900**（首页/详情画板按内容拉高到 1640/1400）。建议 `minWidth 1200 / minHeight 720`。
- 内容区可用宽 = 1440 − 220 − 32×2 = **1156px**；首页 6 张 DramaCard（172×6 + 16×5 = 1112）单行放下。
- macOS 用 `titleBarStyle: 'hiddenInset'`，红绿灯落在侧栏左上（设计稿 12px 圆点，x=20,y=16 附近）；Windows 隐藏菜单栏。
- 播放页：全屏沉浸，背景 `#000`，**隐藏侧栏与顶栏**，左上角红绿灯 + 「‹ 返回详情 Esc」胶囊。

### 2.2 设计 Token（`tokens.css`）

> 已落地为 Tailwind v4 `@theme static`（见 §8.3「样式规范」）。下表为设计稿取值，代码中的命名映射：`--bg-xxx` → `bg-xxx`（`--bg-nav-active`→`nav`，`--bg-btn-ghost`→`ghost`，`--bg-player`→`black`），`--text-N` → `text-fg-N`，`--white-α` → `white/α`，圆角 → `rounded-N`，字号 → `text-N`（px）。

**颜色**

| Token | 值 | 用途 |
|---|---|---|
| `--bg-app` | `#0E0E12` | 页面底色 |
| `--bg-sidebar` | `#09090C` | 侧栏 |
| `--bg-player` | `#000000` | 播放页底色 |
| `--bg-drawer` | `#111116` | 选集抽屉 |
| `--bg-panel` | `#141419` / `#141418` | 选集区容器 / 榜单列表容器 |
| `--bg-card` | `#16161C` / `#17171D` / `#1A1A20` | 更新卡 / 继续观看卡 / 顶栏控件、预告卡、分段控件底 |
| `--bg-card-2` | `#1C1C22` / `#1C1C23` | RankRow hover / 抽屉分段底、已看格 |
| `--bg-tile` | `#22222A` | 未看选集格 |
| `--bg-tile-hover` | `#2E2E38` | 选集格 hover、分段控件选中 |
| `--bg-nav-active` | `#1F1F26` | 侧栏当前项 |
| `--bg-kbd` | `#26262E` | ⌘K 键帽 |
| `--bg-btn-ghost` | `#24242C` | RankRow「立即观看」 |
| `--track` | `#2A2A33` / `#2A2A32` | 进度条底 |
| `--brand` | `#FF2D55` | 主色 |
| `--brand-2` | `#FF6B3D` | 渐变终点、第 2 名 |
| `--brand-3` | `#FFB547` / `#FFBF4D` | 第 3 名 |
| `--brand-soft` | `#FF5C7A` | 链接、热度、倒计时文字 |
| `--brand-gradient` | `linear-gradient(90deg,#FF2E54,#FF6B3D)` | 主按钮 |
| `--logo-gradient` | `linear-gradient(135deg,#FF7A45,#FF3D5C,#E31A59)` | Logo 底板 |
| `--leaf` | `#5BE08A` | Logo 叶子 |
| `--text-1` | `#FFFFFF` | 标题 |
| `--text-2` | `#F4F4F5` / `#E4E4E7` / `#D4D4D8` | 正文强 / 正文 / 次级 |
| `--text-3` | `#B4B4BE` / `#A1A1AA` / `#A8A8B2` | 侧栏未选中、描述 |
| `--text-4` | `#8A8A96` / `#7C7C88` / `#6A6A76` | 辅助、More 链接、占位 |
| `--text-5` | `#5A5A66` | 分组标签、已看集数、第 4+ 名次 |
| `--icon-muted` | `#9A9AA6` | 侧栏未选中图标 |
| `--rank-dim` | `#3A3A44` | 首页 TOP5 第 4/5 名大数字 |
| `--trend-up / down / new` | `#FF5C7A` / `#8A8A96` / `#FFC04D` | 名次趋势 |
| `--white-10 / 12 / 14 / 25 / 35` | `rgba(255,255,255,.10/.12/.14/.25/.35)` | 玻璃按钮、标签、进度底、轮播点 |

**圆角**：`4`（小标签）、`6`（Tag/RankTag）、`8`（缩略图）、`10`（卡片海报、EpTile、Nav、RankRow hover）、`12`（预告卡、更新卡、横屏视频）、`14`（继续观看卡、海报）、`16`（面板、领奖台卡、竖屏视频）、`20`（Hero、详情头、搜索框）、`23`（主按钮 h46）、`999`（胶囊）。

**阴影**：主按钮 `0 8px 24px rgba(255,46,84,.45)`；Hero 当前缩略图 `0 8px 20px rgba(0,0,0,.5)`；竖屏视频 `0 20px 60px rgba(0,0,0,.6)`；详情海报 / TOP5 海报：深色投影。

**字体**

| 族 | 用途 | 字号/字重 |
|---|---|---|
| `Noto Sans SC` | 全部中文 | 10 Medium（角标）· 11 Medium（分组标签）· 12 Regular/Medium/Bold（辅助、Tab、分区）· 13 Regular/Medium/Bold（正文、按钮次级、More）· 14 Regular/Medium/Bold（导航、卡片标题、集数）· 15 Bold/Medium（主按钮）· 16 Bold（抽屉剧名、类型 Tab）· 17 Bold（领奖台标题）· 18 Bold（Logo、横屏 caption）· 20 Bold（区块标题）· 24 Bold（横屏剧名）· 32 Bold（榜单页标题）· 36 Black（详情标题）· 44 Black（Hero 标题） |
| `Inter` | 数字与英文 | 11 Medium（⌘K）· 12 Medium/SemiBold（时间 / 倍速、清晰度）· 13 Medium（趋势 ↑3）· 14 Medium/SemiBold/Bold（集数 / hover / 当前集） |
| `Bebas Neue` | 名次大数字 | 34（RankRow 04+）· 56（领奖台 01–03）· 150（首页 TOP5） |

> 字体加载：Noto Sans SC 走系统字体栈兜底（`"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif`）；Inter 与 Bebas Neue 建议打包子集到 `assets/fonts/`。

### 2.3 页面精确规格

#### 侧栏 Sidebar（`3:16`）
- 220 宽，纵向，`padding 16 16 24 16`，`gap 4`，右侧 1px 白色低透明描边。
- Logo 行：`padding 28 8`，`gap 10`；Mark 34×34 r8 渐变底 + 白色果形 + 绿叶；文字「红果短剧」18 Bold。
- 分组标签「发现 / 我的」：11 Medium `#5A5A66`。
- Nav 项：h40，r10，`padding 0 12`，`gap 12`，icon 18；默认 label 14 Regular `#B4B4BE`、icon 描边 `#9A9AA6`；active：bg `#1F1F26`、label 14 Medium `#FFF`、icon 描边 `#FF2D55`。
- 导航顺序：首页 / 排行榜 / 分类找剧 / 真人剧 / 漫剧 / AI 剧 ‖ 观看历史 / 我的追剧（右侧角标 `#FF2D55` r10 `padding 1 7` 10px「3 更新」）。
- 底部 UpdateCard：`#16161C`，r12，`padding 14`，描边 `#FF2E54`；「新版本 v1.3.0 可用」13 Medium + 「重启即可完成更新 →」12 `#FF5C7A`。

#### 顶栏 TopBar（`3:77`）
- h40，`gap 12`：Back / Forward 32 圆 `#1A1A20`（不可用时 icon `#5A5A66`）；搜索框 420×40 r20 `#1A1A20` 描边 white-α，`padding 0 16`，占位 13 `#6A6A76`，右侧 kbd「⌘K」`#26262E` r5 11 Inter；热搜词 12 `#6A6A76`。

#### 首页 Home（`3:26`）
- **Hero**（`3:94`）：h440 r20 背景图；左侧遮罩 `#0D0D12` 0.95→0.60→0；底部 180px 遮罩 0→0.85；内容区 480 宽 `gap 16`：RankTag（`#FF2D55` r6 `padding 4 10` 12 Bold「热播榜 NO.1」）→ 标题 44 Black → Meta 13 Medium `#D4D4D8` → 简介 14 `#A1A1AA` → 按钮行（`gap 12`，上边距 8）；主按钮 h46 r23 渐变+阴影 15 Bold「立即播放」，次按钮 white-14 「追剧」15 Medium。右侧缩略图带 `gap 12`：84×120 r10，当前 104×148 + 2px 白描边 + 阴影。底部「滑动查看更多短剧 ← →」12 + 指示点（当前 24×4 `#FF2D55`，其它 8×4 white-35）。
- **继续观看**（`3:128`）：区块标题 20 Bold + 「观看历史 →」13 `#7C7C88`；卡片 h108 r14 `#17171D` `padding 10` `gap 14`，3 张等分 `gap 16`：缩略图 64×88 r8，标题 14 Medium `#F4F4F5`，副文「看到第 23 集 · 剩余 57 集」12 `#7C7C88`，进度条 h4 r2 底 `#2A2A33`，右侧播放圆钮 36 `#FF2D55`。
- **热播短剧**（`3:163`）：标题 + 胶囊 Tab（`padding 5 12` r14；选中 bg `#FFF` 文字 `#0E0E12` 12 Medium；未选 `#1A1A20` `#A1A1AA`）+ 「查看全部 →」；网格 `gap 16` × 6 张 DramaCard。
- **本周热度榜 TOP 5**（`3:183`）：5 个 220×210 单元：Bebas 150px 大数字（1 `#FF2D55` / 2 `#FF7A45` / 3 `#FFB547` / 4-5 `#3A3A44`）叠在左侧，海报 146×210 r10 + 阴影靠右。

#### 剧集详情 Detail（`3:205`）
- **DetailHeader**（`3:391`）：h400 r20，背景为海报放大图；上覆 `#0F0F14` 82% + `backdrop-blur 40`；海报 224×320 r14 + 阴影；Info 800 宽 `gap 14`：面包屑 12 `#7C7C88` → 标题 36 Black → Stats（`gap 20`：热度 14 Bold `#FF5C7A`、「全351集 · 已完结」「漫剧 · 2026」14 Medium `#D4D4D8`）→ Tags（white-10 r6 `padding 4 10` 12 `#E4E4E7`）→ 简介 680 宽 14 `#A1A1AA` → 按钮行：主按钮「继续看 第 14 集」/「立即播放」、「已追剧」white-12、分享 46 圆钮。
- **选集**（`3:421`）：容器 `#141419` r16 `padding 24` `gap 16`；头部：标题 20 Bold + RangeTabs（`gap 20`，13px，当前 Bold `#FF2D55`，其它 `#7C7C88`，「1-50 / 51-100 / … / 301-351」）+ 「正序 ⇅」13 `#A1A1AA`；网格 `gap 10`，格子 **101×44** r10；图例 12 `#5A5A66`。
- **看了这部的人还在看**：同首页热播区块，6 张 DramaCard。

#### 播放页 · 竖屏 Player（`3:477`）
- 底 `#000`；Stage 背景为剧照 + `#000` 55% + blur；视频 **452×804** r16 阴影，水平居中。
- 视频内底部 220px 渐变遮罩；Caption 360 宽：剧名 16 Bold、「第 14 集 ·「…」」13 `#D4D4D8`；Controls 412 宽 `gap 10`：进度条（track h4 r2 white-25，已播 `#FF2D55`，knob 12 白）+ 控制行（`gap 16`：暂停 20、下一集 20、时间 12 Inter Medium `#D4D4D8` 占满、倍速 12 SemiBold、清晰度 12 SemiBold、全屏 18）。
- 左上 TopLeft `gap 14`：红绿灯 + BackPill（white-12 r18 `padding 8 14 8 10` 13 Medium「返回详情 Esc」）。
- 右侧 ActionRail 56 宽纵向 `gap 22`：点赞 / 已追 / 分享，各 48 圆钮 white-14 + 11px 标签；点赞心 `#FF2D55`，追剧星 `#FFB547`。
- 右下 EpisodeSwitch 48 宽 `gap 12`：Prev white-14、Next 白底黑箭头。
- **EpisodeDrawer**（`3:534`）：380 宽 `#111116`，`padding 28 24 24 24`，`gap 18`，左侧 1px 分割线。SeriesHead（缩略图 64×88 r8，剧名 16 Bold，副文 12 `#7C7C88`，「查看简介 →」12 Medium `#FF5C7A`）→ Seg（h36 r10 `#1C1C23` `padding 3`，选中 r8 `#2E2E38` 13 Medium）「选集 / 相关推荐」→ Ranges（`gap 16` 12px，「1-30 / 31-60 / 61-90 / 91-120 / ···」）→ EpGrid（`gap 8`，**60×44** r10，5 列）→ UpNext（`#1A1A20` r12 `padding 14` `gap 12`：「下一集预告」13 Bold + 「5s 后自动播放」12 `#FF5C7A`；缩略图 128×72 r8 + 「第15集」14 Medium + 简介 12；倒计时条 h3 `#2A2A32` / `#FF2D55`）→ 撑开 → AutoNext（`#1A1A20` r12 `padding 14`，文字 13 `#E4E4E7`，开关 36×20 r10 `#FF2D55` knob 16）。

#### 播放页 · 横屏 Landscape（`16:1`）
- 视频 **1012×569** r12（16:9）；Stage 背景 `#000` 72%；底部 280px 遮罩；Caption 600 宽：「第 14 集「…」」18 Bold + 「剧名 · 1080P · 16:9 横屏片源」13 `#D4D4D8`；Controls 964 宽，控制行 `gap 20`：上一集 / 暂停 / 下一集 20、时间、倍速、「字幕」12 Medium、影院模式胶囊（r4 `padding 3 8`）、清晰度、全屏 18。视频右上 OrientBadge：`#000` 45% r6 `padding 5 10` 12 Medium「16:9 横屏 · 已自动切换宽屏布局」。
- **InfoBar**（`16:121`）1012 宽 `gap 24`：左 Meta（标题 24 Bold；标签行 `gap 8`：tag-hot `#FF2D55` 18% r4 `padding 3 8` + 「AI 剧 · 科幻 / 末世 / 机甲 · 4280 万热度 · 更新至第 24 集」13 `#A8A8B2`）；右 ActionRail 横排 `gap 12`：胶囊 r24 white-10 `padding 6 16 6 6`，内 32 圆钮 + 13 Medium 文字（12.4万 / 已追 / 分享）。
- **MoreLandscape**（`16:133`）：「更多横屏好剧」15 Bold + 「查看全部 →」12 `#9999A3`；4 张等分 LCard h108 r8 横图背景，`padding 10 10 8`，标题 13 Medium 贴底。
- 抽屉与竖屏完全一致。

#### 排行榜 Rank（`3:598`）
- **RankHeader**：「热播排行榜」32 Bold + 「每小时更新 · 按全站播放热度排序 · 更新于 17:00」13 `#7C7C88`；右侧 PeriodSeg（r10 `#1A1A20` `padding 3`；seg `padding 6 16` r8；选中 `#2E2E36` 13 Medium 白，其它 `#8A8A96`）「日榜 / 周榜 / 新剧榜」。
- **TypeTabs** `gap 32`：16px，选中 Bold 白 + 下划线 24×3 r2 `#FF2D55`（滑动过渡）；未选 Regular `#8A8A96`。「热播短剧 / 热播真人剧 / 热播漫剧 / 热播 AI 剧」。
- **Podium TOP3** `gap 20`，三张等分：r16 `padding 18` `gap 18`，渐变底（1：`#FF2E54` 28%→`#1A1A21`，描边 `#FF2E54`；2：`#FF6B3D` 22%，描边 `#FF6B3D`；3：`#FFBF4D` 18%，描边 `#FFBF4D`）；海报 132×186 r10；右侧 Info `gap 8`：名次 56 Bebas（`#FF2D55` / `#FF6B3D` / `#FFC04D`）→ 标题 17 Bold → 标签 12 `#8A8A96` → 撑开 → 热度+趋势 13 Medium（`#FF5C7A` / `#FF8A5C` / `#8A8A96`）。
- **RankList 4-10**：容器 `#141418` r16 `padding 8` `gap 2`；RankRow `padding 12 24` `gap 18`：名次 40 宽 34 Bebas `#5A5A66` → 海报 54×76 r6 → Info `gap 6`（标题 15 Medium；「仙侠 · 修真 · 全120集　｜　一句话简介」12 `#7C7C88`）→ 热度 110 宽 13 Medium `#B4B4BE` → 趋势 44 宽 13 Inter Medium → 「立即观看」r16 `padding 7 16` `#24242C` 12 Medium。hover：行底 `#1C1C22` r10，按钮变 `#FF2D55`。
- 底部「下滑加载 11–50 名」13 `#5A5A66`。

### 2.4 组件清单（设计稿命名 → 代码命名）

| 设计稿 | 组件 | 规格摘要 |
|---|---|---|
| DramaCard `3:9` | `DramaCard.vue` | 172 宽纵向 `gap 8`：海报 172×240 r10 + 底部 90px 渐变 + 角标「全80集」11 Medium 左下；标题 14 Medium `#F4F4F5`（单行省略）；标签「都市 · 甜宠 · 豪门」12 `#7C7C88`。hover：上浮 4px + 海报 scale 1.05 + 居中播放钮，200ms ease-out |
| EpTile `3:558` | `EpTile.vue` | 默认 60×44（抽屉）/ 101×44（详情）r10，Inter 14；**未看** `#22222A` / `#E4E4E7` Medium；**已看** `#1C1C23` / `#5A5A66`；**当前** `#FF2E54` 16% + 1px 描边 `#FF2E54` + 三根跳动竖条 + `#FF2D55` Bold；**hover** `#2E2E38` + 1px 白描边 + SemiBold 白 |
| RankRow `3:834` | `RankRow.vue` | 见 2.3 排行榜 |
| PodiumCard `3:809` | `RankPodiumCard.vue` | 见 2.3 排行榜，接收 `rank: 1\|2\|3` 决定配色 |
| Hero `3:94` | `HeroCarousel.vue` + `HeroThumbStrip.vue` | 见 2.3 首页 |
| ResumeCard `3:133` | `ContinueCard.vue` | 见 2.3 首页 |
| RankItem `3:188` | `RankTop5Item.vue` | 首页 TOP5 大数字 + 海报 |
| Section Header | `SectionHeader.vue` | 20 Bold 标题 + 可选 Tabs 插槽 + 右侧 More 链接 |
| Tabs `3:166` | `FilterTabs.vue` | 胶囊 Tab |
| PeriodSeg `3:788` / Seg `3:541` | `SegmentControl.vue` | 分段控件（两种尺寸） |
| TypeTabs `3:795` | `UnderlineTabs.vue` | 下划线滑动 Tab |
| RangeTabs `3:424` / Ranges `3:546` | `EpisodeRangeTabs.vue` | 分区文字 Tab |
| EpisodeGrid `3:431` / EpGrid `3:552` | `EpisodeGrid.vue` | 自动列数 + EpTile |
| Video + Controls | `VideoStage.vue` + `PlayerControls.vue` | 竖/横两套尺寸由 `layout` prop 决定 |
| ActionRail `3:511` / `16:7` | `PlayerActions.vue` | `direction: 'vertical' \| 'horizontal'` |
| EpisodeDrawer `3:534` | `EpisodeDrawer.vue` | 380 宽，含 SeriesHead / Seg / Ranges / EpGrid / UpNext / AutoNext |
| UpNext `3:585` | `NextEpisodeCard.vue` | 5s 倒计时 |
| InfoBar `16:121` | `PlayerInfoBar.vue` | 横屏专用 |
| MoreLandscape `16:133` | `LandscapeMoreRow.vue` | 横屏专用 |
| BackPill `3:507` | `BackPill.vue` | 返回详情 |
| UpdateCard `3:71` | `SidebarUpdateCard.vue` | 替代现有 `UpdateButton.vue` |
| Search `3:84` | `SearchBox.vue` + `SearchOverlay.vue` | ⌘K 浮层 |
| BtnPlay / BtnFollow | `BaseButton.vue` | `variant: 'primary' \| 'glass' \| 'ghost'`，`size: 'lg'(46) \| 'sm'(30)` |
| tag | `Tag.vue` | white-10 r6 / brand-18 r4 |
| Switch-on `3:556` | `Toggle.vue` | 36×20 |
| — | `SkeletonCard.vue` / `SkeletonRow.vue` / `EmptyState.vue` / `ErrorState.vue` / `ToastHost.vue` | 状态组件 |

### 2.5 交互规范（画板 05 原文）

**全局**：⌘K 唤起搜索浮层 · ⌘[ / ⌘] 前进后退 · 侧栏常驻，播放页隐藏侧栏 · 页面切换 fade + 8px 上移 180ms · 骨架屏代替 Loading 圈。

**首页 · 发现**
- Hero 横滑轮播：首尾克隆实现无限循环，6s 自动切换，悬停暂停；← → 键或触控板横滑切换
- 右侧缩略图带：点击直接切到对应剧，高亮红框
- 剧卡 hover：上浮 4px + 海报放大 1.05 + 出现播放按钮，200ms ease-out
- 继续观看：进度条显示，点击直接进入播放页对应集
- 分类 Tab（全部/真人/漫剧/AI）：只刷新区块内容，不跳页

**排行榜**
- 四类 Tab 对应 `/rank/hot-drama` 等子路由，切换时下划线滑动过渡
- 日榜/周榜/新剧榜为分段控件，保留在 URL query
- TOP3 领奖台卡片 + 4 名起列表；行 hover 底色提亮，按钮变红
- 名次趋势：红 ↑ 上升、灰 ↓ 下降、黄 NEW 新上榜
- 下滑到底自动加载下一页（11–50 名）

**剧集详情**
- 主按钮根据历史切换文案：「立即播放」/「继续看 第N集」
- 选集按 30 集分区间 Tab（详情页展示为 50 一段）；格子三态：已看（灰）、当前（红框）、未看
- 封面背景取海报模糊色，滚动时顶部标题吸顶
- 追剧按钮点击：心形弹跳 + Toast「已加入我的追剧」
- 推荐区与首页同一 DramaCard 组件

**播放页 · 快捷键**
- 空格 播放/暂停 · ↑ ↓ 或滚轮 切上/下一集（竖向滑动过渡，同抖音）
- ← → 快退/快进 5s · F 全屏 · Esc 返回详情
- 控制条 3s 无操作自动隐藏，鼠标移动唤出
- 单集播完：右侧预告卡 5s 倒计时自动连播，可在抽屉中关闭
- 选集抽屉 380px，可折叠（快捷键 E），折叠后视频居中
- **横竖屏自适应：按片源宽高比（`resolvePlayback` 返回的 `width/height`）自动选布局，≥1 走横屏 16:9 大画面，<1 走竖屏 9:16 居中**
- 横屏态：上/下一集收进控制条，点赞/追剧/分享改为画面下方横排胶囊，下方补「更多横屏好剧」
- 横屏影院模式（T）：收起抽屉 + 隐藏信息栏，画面铺满主区；双击画面 = 全屏

### 2.6 应用图标（画板 06，`17:1`）
- 概念：红果 + 播放键——果实轮廓里镂空圆角三角，右侧咬口，绿叶 `#5BE08A`；底板渐变与主色一致。
- macOS 母版：1024 画布内 824 圆角矩形 + 投影（Big Sur 网格）；梯度 512/256/128/64/32/16（16 去叶）。
- Windows 母版：满版圆角方，无投影（ICO 内 256 层）；梯度 256/48/32/24/16（≤24 去叶、字形放大）。
- 导出目标：`build/icon.icns`、`build/icon.ico`、`build/icon.png`（512）、`resources/icon.png`。

---

## 3. 技术选型

| 层 | 方案 | 版本（2026-11-11 npm latest） |
|---|---|---|
| 壳 | Electron + electron-vite | 已有（electron 44 / electron-vite 6 / vite 8） |
| 视图 | Vue 3 **组合式 API，仅 `<script setup lang="ts">`**（禁止 Options API / `defineComponent`，见 §8.3） | `vue ^3.5` 已有 |
| 状态 | **Pinia** | `pinia@4.1.0` |
| 持久化 | `pinia-plugin-persistedstate` | `4.7.1` |
| 路由 | **vue-router** | `vue-router@5.5.0` |
| 工具 | `@vueuse/core`（`useEventListener` / `useIdle` / `useMagicKeys` / `useIntersectionObserver` / `useVirtualList`） | `15.0.0` |
| 播放 | 原生 `<video>` + `hls.js`（m3u8）；受保护流（`cenc-aes-ctr`）走 `shaka-player` ClearKey（二期） | 按需 |
| 样式 | **Tailwind CSS v4**（`@tailwindcss/vite` 插件，token 写在 `@theme`）+ `prettier-plugin-tailwindcss` 类名排序；不引入 UI 组件库 | `tailwindcss@4.3.5` |
| 数据 | `openhongguo`（main 进程 WASM SDK，经 IPC 暴露） | `^0.2.0` 已有 |

安装：

```sh
pnpm add pinia vue-router pinia-plugin-persistedstate @vueuse/core hls.js
pnpm add -D tailwindcss @tailwindcss/vite prettier-plugin-tailwindcss
```

> pinia 4 / vue-router 5 均为近期大版本，动工前扫一遍各自 CHANGELOG 的 breaking changes；本文只使用两者长期稳定的核心 API（`createPinia / defineStore(setup) / storeToRefs`、`createRouter / createWebHashHistory / useRoute / useRouter / beforeEach`）。

---

## 4. 路由设计

```ts
// src/renderer/src/router/routes.ts
export const routes = [
  {
    path: '/',
    component: () => import('@renderer/layouts/MainLayout.vue'),   // 侧栏 + 顶栏
    children: [
      { path: '', name: 'home', component: () => import('@renderer/views/HomeView.vue') },
      { path: 'rank', redirect: '/rank/hot-drama' },
      {
        path: 'rank/:type(hot-drama|real|comic|ai)',
        name: 'rank',
        component: () => import('@renderer/views/RankView.vue'),
        props: true                                                   // type → prop；board 从 query 读
      },
      { path: 'detail', name: 'detail', component: () => import('@renderer/views/DetailView.vue') }, // ?series_id=
      { path: 'category', name: 'category', component: () => import('@renderer/views/CategoryView.vue') }, // ?genre=
      { path: 'search', name: 'search', component: () => import('@renderer/views/SearchView.vue') },       // ?q=（⌘K 浮层回车进入）
      { path: 'history', name: 'history', component: () => import('@renderer/views/HistoryView.vue') },
      { path: 'following', name: 'following', component: () => import('@renderer/views/FollowingView.vue') }
    ]
  },
  {
    path: '/play',
    component: () => import('@renderer/layouts/PlayerLayout.vue'),   // 无侧栏、黑底
    children: [{ path: '', name: 'play', component: () => import('@renderer/views/PlayView.vue') }] // ?series_id=&ep=
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]
```

要点：

- **history 模式必须用 `createWebHashHistory()`**（生产环境 `loadFile` 走 `file://`，HTML5 history 会在刷新/深链时 404）。
- 侧栏「真人剧 / 漫剧 / AI 剧」= `/category?genre=real|comic|ai`，「分类找剧」= `/category`。
- `/detail` 与 `/play` 采用 query 传参，与设计稿 05 路由卡片一致。
- 全局 `beforeEach`：`series_id` 缺失时重定向首页；`afterEach`：写入 `uiStore.canGoBack/Forward`、同步侧栏高亮、`document.title`。
- 过渡：`<RouterView v-slot="{ Component }"><Transition name="page"><component :is="Component" /></Transition></RouterView>`，`.page-enter-from { opacity:0; transform:translateY(8px) }`，180ms。
- 滚动：内容区容器（非 window）滚动，列表页返回时用 `uiStore.scrollPositions[fullPath]` 恢复。

---

## 5. 状态管理设计（Pinia）

统一使用 **setup store** 写法。

| Store | 文件 | 状态 | 持久化 |
|---|---|---|---|
| `useUiStore` | `stores/ui.ts` | 搜索浮层开关、Toast 队列、滚动位置、前进/后退可用性 | 否 |
| `useHomeStore` | `stores/home.ts` | `heroItems`、`continueList`（派生自 history）、`hotList` + 当前分类 Tab、`top5`、各区块 loading/error | 否（内存 TTL） |
| `useRankStore` | `stores/rank.ts` | 按 `type+board` 为 key 的分页缓存 `{ items, cursor, hasMore }`、`contents`（服务端榜单目录） | 否 |
| `useSeriesStore` | `stores/series.ts` | `Map<seriesId, Series>`、`Map<seriesId, Episode[]>`、`Map<seriesId, SeriesSummary[]>`（推荐）；`ensureSeries(id)` / `ensureEpisodes(id)` / `refreshCover(id)` | 否 |
| `usePlayerStore` | `stores/player.ts` | `seriesId / episodeId / epNumber`、`playback`、`currentStream`、`playing / currentTime / duration / volume / rate / quality / fullscreen`、`autoNext`、`drawerOpen`、`drawerTab`、`layout: 'portrait' \| 'landscape'`、`theaterMode`、`controlsVisible` | 部分（volume / rate / quality / autoNext / drawerOpen） |
| `useHistoryStore` | `stores/history.ts` | `records: Record<seriesId, { seriesId, title, cover, epNumber, episodeId, positionSec, durationSec, totalEp, updatedAt }>`；`continueList` getter | **是**（`hg:history`） |
| `useFollowStore` | `stores/follow.ts` | `items: Record<seriesId, { title, cover, totalEp, lastSeenEp, followedAt }>`；`updateCount` getter（侧栏「N 更新」角标） | **是**（`hg:follow`） |
| `useSearchStore` | `stores/search.ts` | `query`、`suggestions`、`hotSearch`、`cues`（顶栏滚动热搜）、结果分页、最近搜索 | 最近搜索持久化 |
| `useUpdateStore` | `stores/update.ts` | 包装 `window.api.update.*`，承接 `UpdateState`，驱动侧栏 UpdateCard | 否 |

规范：

- Store 动作统一通过 `services/api.ts` 的 `invoke()` 解包 `IpcResult`，失败抛 `ApiError { code, message, retryable }`。
- 列表类数据带 `fetchedAt`，TTL 5 分钟；详情类 10 分钟；封面 `cover_expires_at` 过期前 1 分钟视为失效。
- 播放进度写入 `historyStore` 节流 5s，切集 / `beforeunload` 强制 flush。
- 组件中只用 `storeToRefs()` 解构 state/getter。
- `layout` 判定：`Episode.vertical` 优先；否则 `currentStream.width / height >= 1 ? 'landscape' : 'portrait'`。

---

## 6. 数据层：IPC 扩展

现有 `src/main/ohg.ts` 只暴露 4 个通道，按页面补齐（SDK 方法见 `node_modules/openhongguo/index.d.ts`）：

| 页面需求 | SDK 方法 | IPC 通道 | 备注 |
|---|---|---|---|
| 首页 Hero / 热播 | `discover({ channel, cursor })` | `ohg:discover` | |
| 首页分类 Tab / 分类页 | `shortFilter({ selections, cursor })` + `shortFilterPanel(genre)` | `ohg:short-filter` / `ohg:short-filter-panel` | genre 取值以 panel 返回为准 |
| 首页 TOP5 / 排行榜 | `shortRank({ content, board, cursor })` | `ohg:short-rank` | content：`all / human / comic_series_rank / ai_playlet`；board 取 `contents[].boards[]` |
| 顶栏热搜 / 搜索 | `searchCues()` / `hotSearch()` / `suggest(prefix)` / `search()` | `ohg:search-cues` / `ohg:hot-search` / `ohg:suggest` / `ohg:search` | 实测：`searchCues` 匿名下无数据，顶栏改用 `hotSearch`；`search` 每页约 6 条、**不含 `cover_url`**，结果需 `prefetch(getSeries)` 补封面；`suggest` 的 `kind===2` 时 `keyword` 为 seriesId，可直达详情 |
| 详情 | `getSeries(id)` | `ohg:series` | `heat` 原始数值 → 「6868万热度」 |
| 选集 | `listEpisodes(id, { cursor, pageSize })` | `ohg:episodes`（补分页） | 351 集需循环翻页 |
| 相关推荐 | `seriesRecommend(id)` | `ohg:recommend` | |
| 多季 | `seasons(id)` | `ohg:seasons` | 二期 |
| 播放 | `resolvePlayback(episodeId)` | `ohg:playback` | 优先非 protected、`definition` 最高；HLS 用 hls.js |
| 设备重置 | `resetDevice()` | `ohg:reset-device` | 遇 `DEVICE_REJECTED` 自动触发一次 |

通道名与类型集中到 `src/shared/ipc.ts`，三端共用：

```ts
// src/shared/ipc.ts
export interface OhgChannels {
  'ohg:discover': (opts?: DiscoverOptions) => Page<SeriesSummary>
  'ohg:short-rank': (q?: ShortRankQuery) => ShortRanking
  'ohg:series': (seriesId: string) => Series
  // ...
}
export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string; retryable?: boolean } }
```

### 媒体播放注意事项

- `Stream.url` 带签名会过期（`Playback.expires_at`），切集前检查，过期重新 `resolvePlayback`。
- `Stream.hls === true` → `hls.js`；否则直接 `<video src>`。
- `Stream.protected === true` 且有 `contentKey` → ClearKey（EME）；**一期先过滤受保护流，全部受保护则提示"该集暂不支持播放"**。
- 渲染进程请求 CDN 若遇 403，用 `session.webRequest.onBeforeSendHeaders` 在 main 改写 `Referer` / `User-Agent`。

---

## 7. 代码目录清单

```
HongguoDesktop/
├─ build/                              # 打包资源（icon.icns / icon.ico / icon.png，待按画板 06 替换）
├─ resources/icon.png
├─ eslint.config.mjs                   # (改) 新增 Vue 组件规范规则（§8.3）
├─ docs/
│  ├─ 开发文档-UI重构.md                 # 本文档
│  └─ design/                          # 旧导出，不再维护，以 Ardot 在线稿为准
├─ src/
│  ├─ shared/                          # 三端共享的纯类型 / 常量
│  │  ├─ update.ts                     # (已有) UpdateState
│  │  ├─ ipc.ts                        # [新] IPC 通道名 + 参数/返回类型 + IpcResult
│  │  └─ constants.ts                  # [新] 榜单类型映射、分区大小（30/50）、TTL
│  │
│  ├─ main/
│  │  ├─ index.ts                      # (改) 1440×900 / min 1200×720、backgroundColor、titleBarStyle、注册新 handler
│  │  ├─ app-menu.ts                   # (已有)
│  │  ├─ ohg.ts                        # (改) 补齐 §6 的 IPC 通道
│  │  ├─ media-headers.ts              # [新] webRequest 改写 CDN 请求头（按需）
│  │  └─ updater/                      # (已有)
│  │
│  ├─ preload/
│  │  ├─ index.ts                      # (改) 由 shared/ipc.ts 映射生成 api
│  │  └─ index.d.ts                    # (改) window.api 类型
│  │
│  └─ renderer/
│     ├─ index.html
│     └─ src/
│        ├─ main.ts                    # (改) createApp → use(pinia) → use(router) → mount
│        ├─ App.vue                    # (改) <RouterView> + <ToastHost> + <SearchOverlay>
│        ├─ env.d.ts
│        │
│        ├─ router/
│        │  ├─ index.ts                # createRouter(createWebHashHistory) + guards + scrollBehavior
│        │  └─ routes.ts               # 路由表（§4）
│        │
│        ├─ stores/                    # Pinia（§5）
│        │  ├─ index.ts                # createPinia + persistedstate
│        │  ├─ ui.ts
│        │  ├─ home.ts
│        │  ├─ rank.ts
│        │  ├─ series.ts
│        │  ├─ player.ts
│        │  ├─ history.ts
│        │  ├─ follow.ts
│        │  ├─ search.ts
│        │  └─ update.ts
│        │
│        ├─ services/
│        │  ├─ api.ts                  # 封装 window.api，解包 IpcResult，统一 ApiError
│        │  ├─ cache.ts                # 带 TTL 的内存缓存
│        │  ├─ format.ts               # 热度 / 集数 / 时长 / 趋势 文案格式化
│        │  └─ stream.ts               # 选流策略、过期判断、layout 判定
│        │
│        ├─ composables/
│        │  ├─ useHotkeys.ts           # 全局快捷键（⌘K / ⌘[ ⌘] / 播放页键位，按路由作用域）
│        │  ├─ useInfiniteScroll.ts    # 触底加载
│        │  ├─ useCarousel.ts          # 首尾克隆无限轮播、自动播放、悬停暂停
│        │  ├─ useVideoPlayer.ts       # <video> + hls.js 生命周期、倍速、清晰度、全屏
│        │  ├─ useIdleControls.ts      # 控制条 3s 自动隐藏
│        │  ├─ useDominantColor.ts     # 详情页封面取色
│        │  ├─ useStickyTitle.ts       # 详情页标题吸顶
│        │  └─ useToast.ts
│        │
│        ├─ layouts/
│        │  ├─ MainLayout.vue          # Sidebar + TopBar + 可滚动内容区
│        │  └─ PlayerLayout.vue        # 全屏沉浸容器（黑底、无侧栏）
│        │
│        ├─ views/
│        │  ├─ HomeView.vue            # 01
│        │  ├─ RankView.vue            # 04
│        │  ├─ DetailView.vue          # 02
│        │  ├─ PlayView.vue            # 03 / 03b（按 playerStore.layout 切子布局）
│        │  ├─ CategoryView.vue        # 分类找剧 / 真人 / 漫剧 / AI
│        │  ├─ HistoryView.vue         # 观看历史
│        │  └─ FollowingView.vue       # 我的追剧
│        │
│        ├─ components/
│        │  ├─ layout/
│        │  │  ├─ AppSidebar.vue
│        │  │  ├─ AppTopBar.vue
│        │  │  ├─ SearchBox.vue
│        │  │  └─ SidebarUpdateCard.vue   # 替代现 UpdateButton.vue
│        │  ├─ drama/
│        │  │  ├─ DramaCard.vue
│        │  │  ├─ DramaGrid.vue           # 6 列 gap16
│        │  │  ├─ SectionHeader.vue
│        │  │  ├─ ContinueCard.vue
│        │  │  ├─ HeroCarousel.vue
│        │  │  └─ HeroThumbStrip.vue
│        │  ├─ rank/
│        │  │  ├─ RankPodium.vue          # TOP3 容器
│        │  │  ├─ RankPodiumCard.vue
│        │  │  ├─ RankRow.vue
│        │  │  ├─ RankTop5Item.vue        # 首页 TOP5
│        │  │  └─ TrendBadge.vue          # ↑3 / ↓2 / NEW
│        │  ├─ episode/
│        │  │  ├─ EpisodeGrid.vue
│        │  │  ├─ EpTile.vue
│        │  │  └─ EpisodeRangeTabs.vue
│        │  ├─ player/
│        │  │  ├─ PortraitStage.vue       # 03 布局编排
│        │  │  ├─ LandscapeStage.vue      # 03b 布局编排
│        │  │  ├─ VideoStage.vue          # <video> + 模糊背景 + 遮罩
│        │  │  ├─ PlayerControls.vue
│        │  │  ├─ PlayerActions.vue       # 竖排 / 横排胶囊
│        │  │  ├─ PlayerInfoBar.vue       # 横屏信息栏
│        │  │  ├─ LandscapeMoreRow.vue    # 更多横屏好剧
│        │  │  ├─ EpisodeSwitchArrows.vue # 竖屏右下 ↑↓
│        │  │  ├─ EpisodeDrawer.vue
│        │  │  ├─ NextEpisodeCard.vue
│        │  │  ├─ OrientBadge.vue
│        │  │  └─ BackPill.vue
│        │  ├─ search/
│        │  │  ├─ SearchOverlay.vue
│        │  │  └─ SearchResultItem.vue
│        │  └─ ui/
│        │     ├─ BaseButton.vue          # primary(渐变+阴影) / glass(white-12) / ghost(#24242C)
│        │     ├─ Tag.vue
│        │     ├─ Toggle.vue
│        │     ├─ SegmentControl.vue
│        │     ├─ FilterTabs.vue
│        │     ├─ UnderlineTabs.vue
│        │     ├─ ProgressBar.vue
│        │     ├─ SkeletonBlock.vue
│        │     ├─ SkeletonCard.vue
│        │     ├─ EmptyState.vue
│        │     ├─ ErrorState.vue
│        │     ├─ ToastHost.vue
│        │     └─ AppIcon.vue             # 内联 SVG 图标集合（18px 描边 1.5）
│        │
│        └─ assets/
│           ├─ styles/
│           │  ├─ main.css             # 入口：@import 'tailwindcss' + 下列三个
│           │  ├─ tokens.css           # @theme static：颜色/圆角/字号/阴影/字体/动画
│           │  ├─ base.css             # @layer base（body、滚动条）+ @utility（drag、tag、skeleton…）
│           │  └─ transitions.css      # <Transition> 用：page / fade / slide-* / drawer / pop / ep-*
│           ├─ fonts/                  # Inter / Bebas Neue 子集
│           └─ logo.svg                # 侧栏 Mark（果形 + 咬口 + 叶）
│
├─ electron.vite.config.ts            # (改) 增加 @shared 别名
├─ tsconfig.web.json / tsconfig.node.json  # (改) paths 增加 @shared/*
├─ electron-builder.yml
└─ package.json
```

现有 `App.vue`（调试界面）与 `UpdateButton.vue` 在新布局接入后删除。

---

## 8. 开发建议

### 8.1 推荐实施顺序

1. **基础设施**：安装依赖 → `tokens.css` → `router/` + `stores/index.ts` → `MainLayout` + `AppSidebar` + `AppTopBar` → 所有 view 占位页。跑通路由与过渡动画。
2. **数据层**：`shared/ipc.ts` → 扩展 `main/ohg.ts` → 重写 `preload` → `services/api.ts`。临时页面验证每个通道。
3. **通用组件**：`BaseButton` / `DramaCard` / `EpTile` / `RankRow` / `SegmentControl` / `FilterTabs` / `UnderlineTabs` / `Skeleton*` / `Toast`。建议加一个 dev-only `PlaygroundView` 对照 Ardot 节点逐个调样式（用 `capture_screenshot` 取参考图）。
4. **排行榜页**（数据最规整）→ **首页** → **详情页** → **播放页·竖屏** → **播放页·横屏**。
5. **本地数据**：历史 / 追剧 store 与页面、侧栏角标、详情页主按钮文案。
6. **搜索浮层** 与全局快捷键。
7. 影院模式、受保护流（ClearKey）、多季切换、虚拟列表 — 二期。

### 8.2 工程规范

- **类型单一来源**：数据类型直接 `import type { … } from 'openhongguo'`，renderer 不重复声明。
- **别名**：新增 `@shared` → `src/shared`；renderer 内继续用 `@renderer`。
- **IPC 边界**：renderer 永远不碰 `openhongguo`；SDK 错误在 main 转为 `{ code, message, retryable }`。
- **Store 不持有组件状态**：hover、局部展开留在组件内；跨页面 / 需持久化的才进 Pinia。
- **路由即状态**：榜单类型、分段、series_id、ep 都在 URL；Store 只做缓存。
- **CSS**：Tailwind utility 写在模板上，组件内**不写 `<style>`**（规范见 §8.3「样式规范」）；颜色 / 圆角 / 字号一律用 `@theme` token，禁止散落 hex；设计稿里的 `white-α` 用 `bg-white/10` 这类透明度修饰符，不要用 `opacity` 叠加。
- **图片**：海报 `loading="lazy"` + `aspect-ratio: 172/240`（卡片）/ `3/4`，加载前骨架色；封面 URL 过期触发 `seriesStore.refreshCover(id)`。
- **性能**：
  - 排行榜 11–50 名可先不用虚拟列表；超过 100 项再上 `useVirtualList`。
  - 351 集的选集网格按分区懒渲染，只渲染当前分区（30/50 个）EpTile。
  - 播放页切集复用同一个 `<video>`；当前集进度 ≥ 80% 时预取下一集 `resolvePlayback`。
  - 横竖屏切换只换布局组件（`PortraitStage` / `LandscapeStage`），`VideoStage` 用 `<KeepAlive>` 或提升到父级避免重建。
- **错误态**：每个数据区块三态（skeleton / content / error+重试）；`ANONYMOUS_LIMITED` / `RATE_LIMITED` 按 `retryAfterMs` 自动重试一次。
- **快捷键**：集中在 `useHotkeys.ts`，用 `useMagicKeys` + 当前路由名判定作用域，输入框聚焦时不触发；Windows 上 ⌘ 映射为 Ctrl，⌘[ / ⌘] 另加 Alt+← / →。
- **Lint / 类型**：保持 `pnpm typecheck` 和 `pnpm lint` 为门禁。

### 8.3 Vue 组件规范（强制：组合式 + 精简）

**写法**

- 所有 `.vue` 只用 `<script setup lang="ts">`，块顺序 `script → template`（不写 style）。禁止 Options API、`defineComponent`、`setup()` 函数、mixins。
- 宏顺序：`defineOptions → defineModel → defineProps → defineEmits → defineSlots`。
- `defineProps<{…}>()` / `defineEmits<{…}>()` 一律类型声明；默认值用 Vue 3.5 **响应式 props 解构**（`const { size = 'md' } = defineProps<…>()`），不用 `withDefaults`。
- 双向绑定用 `defineModel()`，不手写 `modelValue` + `update:modelValue`。
- 模板引用用 `useTemplateRef('el')`；组件名需要时用 `defineOptions({ name })`。

**精简**

- 可复用的有状态逻辑（播放器控制、分区分页、快捷键、懒加载）进 `composables/useXxx.ts`，组件只做「取数据 + 绑模板」；纯函数（格式化热度、时长）进 `services/format.ts`。
- 能 `computed` 就不 `watch`；能用 `@vueuse/core` 现成的（`useEventListener`、`useIntersectionObserver`、`useElementHover`）就不自己写生命周期配对。
- 不写只转发的包装函数，模板里能直接调用的就直接调用（如 `@click="emit('play', id)"`）；不为单次使用的值建 `ref`；不加无意义注释。
- 读 store 用 `storeToRefs` 解构状态，actions 直接从 store 实例取。
- hover 动效用 `hover:` / `group-hover:` 变体，不用 JS 维护 hover 状态。

**样式规范（Tailwind v4）**

- **Token**：只用 `@theme` 里的刻度——`bg-card` / `text-fg-3` / `border-white/10` / `rounded-10` / `text-13` / `shadow-primary` / `font-num` / `ease-out`（已覆盖为设计稿曲线）/ `w-sidebar` / `w-drawer`。**不用** `text-sm`、`rounded-lg` 等默认刻度（数值与设计稿不一致）；稿中特殊值用任意值 `h-[46px]`。
- **变体映射**：多状态 / 多尺寸用常量对象 + `:class="MAP[key]"`（见 `BaseButton` 的 `SIZES` / `VARIANTS`、`EpTile` 的 `STATES`）；类名必须是完整字面量，禁止 `` `bg-${c}` `` 拼接。
- **父子联动**：`group` + `group-hover:`；嵌套时用具名 `group/card`。改子组件根样式直接在 `<Comp class>` 上写（fallthrough），不用 `:deep()`。
- **伪元素 / 渐变**：`after:absolute after:bg-linear-to-b after:from-transparent after:to-black/75`。
- **可配置网格**：用 CSS 变量兜底，如 `DramaGrid` 的 `grid-cols-[var(--drama-cols,…)]`，父级写 `class="[--drama-cols:repeat(6,1fr)]"`。
- **动画**：`animate-shimmer / eq / spin / beat`（在 `@theme` 定义）；`<Transition>` 的类集中在 `transitions.css`。
- **全局 utility**（`base.css` 的 `@utility`）：`drag` / `no-drag` / `tag` / `more-link` / `skeleton` / `bg-brand-gradient` / `text-brand-gradient`；单行省略用 `truncate`，多行用 `line-clamp-N`。
- 默认过渡曲线已设为 `ease`（与原生 CSS 一致），需要设计稿曲线时显式写 `ease-out`。
- 类名顺序交给 `prettier-plugin-tailwindcss`，不手排。

**示例**（`EpTile.vue` 全文）

```vue
<script setup lang="ts">
const { number, state = 'unseen' } = defineProps<{
  number: number
  state?: 'unseen' | 'seen' | 'current'
}>()

const HOVER = 'hover:border-white/35 hover:bg-tile-hover hover:font-semibold hover:text-fg-1'
const STATES = {
  unseen: `bg-tile font-medium text-fg-2b ${HOVER}`,
  seen: `bg-card-2 text-fg-5 ${HOVER}`,
  current: 'border-brand bg-brand/16 font-bold text-brand'
}
</script>

<template>
  <button
    class="inline-flex h-11 items-center justify-center gap-1.5 rounded-10 border border-transparent font-num text-14 transition-colors duration-150"
    :class="STATES[state]"
  >
    <span v-if="state === 'current'" class="inline-flex h-[11px] items-end gap-0.5">
      <i v-for="d in [0, -0.3, -0.6]" :key="d" class="h-full w-0.5 origin-bottom animate-eq rounded-[1px] bg-current" :style="{ animationDelay: `${d}s` }" />
    </span>
    {{ number }}
  </button>
</template>
```

**Lint 落地**：已写入 `eslint.config.mjs`（`**/*.vue` 段），`pnpm lint` 即门禁——

| 规则 | 作用 |
|---|---|
| `vue/component-api-style: ['script-setup']` | 禁止 Options API / `defineComponent` / `setup()` |
| `vue/block-order` · `vue/define-macros-order` | 块与宏顺序统一 |
| `vue/define-props-declaration: type-based` · `vue/define-emits-declaration: type-literal` | 类型声明 props / emits |
| `vue/define-props-destructuring: only-when-assigned` | 统一 props 用法 |
| `vue/require-macro-variable-name` | `props` / `emit` / `slots` 命名一致 |
| `vue/prefer-define-options` · `vue/prefer-use-template-ref` | 新 API 优先 |
| `vue/no-unused-properties` · `vue/no-unused-refs` | 清掉无用 props / ref |
### 8.4 Pinia 使用建议

```ts
// stores/history.ts（示意）
export const useHistoryStore = defineStore('history', () => {
  const records = ref<Record<string, HistoryRecord>>({})
  const continueList = computed(() =>
    Object.values(records.value).sort((a, b) => b.updatedAt - a.updatedAt))

  function upsert(r: Omit<HistoryRecord, 'updatedAt'>) {
    records.value[r.seriesId] = { ...r, updatedAt: Date.now() }
  }
  function remove(seriesId: string) { delete records.value[seriesId] }

  return { records, continueList, upsert, remove }
}, { persist: { key: 'hg:history' } })
```

- 持久化只挂在 history / follow / search / player（局部字段），用 `pick` 精确控制，避免把 `playback` 这类带签名 URL 的数据写盘。
- 后续若要更可靠的存储，把 persist 的 `storage` 换成基于 IPC 的 `userData/*.json` 适配器即可。

### 8.5 vue-router 使用建议

- 路由组件全部懒加载，`PlayView` 及 hls.js 单独 chunk。
- 守卫内不访问 store 异步数据；在 view 里 `watch(() => route.query.series_id, …, { immediate: true })` 拉取，保证同路由换参数也能刷新。
- 进入 `/play` 前由 `DetailView` 先 `seriesStore.ensureEpisodes(id)`；播放页自身也要能冷启动。
- `router.afterEach` 同步 `document.title = \`${剧名} - 红果短剧\``。

### 8.6 Electron 侧建议

- `BrowserWindow`：`width: 1440, height: 900, minWidth: 1200, minHeight: 720, backgroundColor: '#0E0E12'`，macOS `titleBarStyle: 'hiddenInset', trafficLightPosition: { x: 20, y: 16 }`。
- 侧栏 Logo 区与播放页 TopLeft 加 `-webkit-app-region: drag`，按钮加 `no-drag`。
- 播放页全屏用 `document.documentElement.requestFullscreen()`；需要原生全屏再走 IPC `win.setFullScreen`。
- 新图标：按画板 06 导出 `icon.icns` / `icon.ico` / `icon.png` 替换 `build/` 与 `resources/`。

### 8.7 与设计稿对照

- 开发时直接用 Ardot MCP `batch_read` 读节点（本文表格里都标了 node id），不要再看 `docs/design/` 的旧导出。
- 组件级走查用 `capture_screenshot`（每批改完只截一次），页面级用 `capture_layout(problemsOnly)` 查间距 / 溢出。

---

## 9. 里程碑建议

| 阶段 | 交付 | 验收 |
|---|---|---|
| M1 骨架 | 依赖、路由、Pinia、布局壳、token、空页面 | 侧栏可导航，过渡动画正确，typecheck 通过 |
| M2 数据 | IPC 全量通道、services、各 store 的 load 动作 | 临时页面能展示每个接口的数据 |
| M3 列表页 | 排行榜 + 首页完整还原 | 对照 Ardot 节点走查；无限滚动、Tab/分段、URL 同步 |
| M4 详情 | 详情页 + 选集网格 + 追剧/历史 | 主按钮文案随历史变化；Toast；返回位置恢复；标题吸顶 |
| M5 播放 | 竖屏 + 横屏播放页、抽屉、自动连播、快捷键、进度记忆 | 连续播放 3 集无卡顿；刷新可恢复；横竖屏自动切换 |
| M6 收尾 | 搜索浮层、历史/追剧页、分类页、图标替换、错误态 | 全流程走查，打包 mac/win 自测 |
| 二期 | 影院模式、ClearKey、多季、虚拟列表 | — |

---

## 10. 待确认事项

> 状态（2026-11-11）：M1–M6 页面已全部实现，并完成 Tailwind v4 全量迁移（renderer 内 0 个 `<style>` 块）；typecheck / lint / build 通过。
> ✅ = 已解决。

1. ✅ `shortFilter` 的 genre 取值：真人剧 `short_play`、漫剧 `comic_series`、AI 剧 `ai_series`（`shortFilterPanel(genre)` 返回主题 / 角色 / 年代 / 排序 / 性别 / 上线时间，漫剧另有完结状态）。
2. 首页 Hero 数据源：设计稿标注「热播榜 NO.1」，倾向取 `shortRank` 热播榜前 5；备选 `discover()` 推荐频道。
3. 「本周热度榜 TOP5」是否即 `shortRank({ content:'all', board:<周榜 id> })` 前 5 条。
4. 受保护流（`protected: true`）占比，决定 ClearKey 是否提前到一期。实测匿名状态下 `resolvePlayback` 普遍返回 `ANONYMOUS_LIMITED`，播放页已提供「重试 / 换个设备重试 / 下一集」错误态。
5. Windows 端窗口控制按钮：自绘（配合无边框）还是保留系统标题栏。
6. 横屏页「字幕」按钮：SDK 目前没有字幕轨接口，一期是否仅做占位 / 隐藏。
7. ✅ 横竖屏判定：流宽高优先；无流时 `episode.vertical === false` 为横屏，其余（含漫剧无标记）默认竖屏。
