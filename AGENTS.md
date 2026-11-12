# AGENTS.md

HongguoDesktop：看短剧的桌面客户端（Electron + Vue 3），UI 布局、跳转、交互参考红果短剧官网。
数据来自 `openhongguo`，主进程通过 IPC 暴露 `window.api.*`，返回 `IpcResult<T>`。

## 常用命令

| 作用 | 命令 |
| --- | --- |
| 本地运行 | `env -u ELECTRON_RUN_AS_NODE pnpm dev` |
| 类型检查 | `pnpm typecheck` |
| 代码检查 | `pnpm lint` |
| 打包 | `pnpm dist:mac` / `pnpm dist:win` |

- 提交前必须通过 `pnpm typecheck` 和 `pnpm lint`。
- 如果运行环境注入了 `ELECTRON_RUN_AS_NODE`，要用上面的 `env -u` 方式启动，否则 Electron 会当成 Node 运行。

## 技术栈

- Electron + electron-vite，渲染进程 Vue 3。
- Pinia（setup store）、vue-router（hash history）、Tailwind v4。
- 路由：`/` → `/rank/:type` → `/detail?series_id` → `/play?series_id&ep`。

## 编码规范（强制）

- Vue 组件只写 `<script setup lang="ts">`，禁止 Options API 和 `defineComponent`。
- 代码要精简：
  - 逻辑抽到 `composables/`，单文件行数不设上限。
  - 能用 `computed` 就不用 `watch`。
  - 不写只做转发的包装函数。
- 样式统一用 Tailwind v4：
  - token 定义在 `src/renderer/src/assets/styles/tokens.css` 的 `@theme` 里。
  - 组件里不写 `<style>`。
  - 样式变体用常量映射对象。
- 以上规则已在 `eslint.config.mjs` 里落地（`vue/component-api-style` 等），详见 `docs/开发文档-UI重构.md` §8.3。

## 设计约定

- 设计稿在线查看：https://ardot.tencent.com/file/745901515002612
  - 01 首页、02 剧集详情、03 竖屏播放页、03b 横屏播放页、04 排行榜、05 交互规范、06 应用图标。
  - 不需要把设计稿导出成 PDF、PNG、SVG 或 HTML 放进仓库。
- 不做登录和 VIP 相关入口。
- "观看历史"和"我的追剧"只存本地。
- 播放页控制条不做字幕功能。
- 视觉：深色底 `#0E0E12`，主色渐变 `#FF2D55 → #FF6B3D`。
- macOS 使用 `hiddenInset` 标题栏，红绿灯在 `x:20, y:18`，顶部左侧的控件要给它让位（见 `services/platform.ts` 的 `isMac`）。
- 应用图标：红果 + 镂空播放键 + 叶子 + 右侧咬口，红橙渐变底板。
  - 打包用的 `build/icon.icns`（含 16~1024 全套）、`build/icon.ico`（16~256）、`build/icon.png` 和 `resources/icon.png`（512）已替换为该图标。
  - macOS 版是 Big Sur 网格（824/1024，带投影），Windows 和 Linux 版是满版圆角方；≤24px 去掉叶子。

## 参考文档

- 完整的页面规格、组件清单、目录结构、里程碑：`docs/开发文档-UI重构.md`。
