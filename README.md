# HongguoDesktop

HongguoDesktop 桌面端项目，基于 [electron-vite](https://github.com/alex8088/electron-vite)（Vue 3 + TypeScript）和 [openhongguo](https://github.com/beilunyang/openhongguo)。

## 结构

- `src/main/ohg.ts`：main 进程创建 SDK 客户端，并注册 `ohg:*` IPC 接口。设备档案保存在 `userData/anonymous.json`
- `src/preload/index.ts`：通过 `contextBridge` 暴露 `window.api`，类型见 `src/preload/index.d.ts`
- `src/renderer`：搜索 → 选集 → 获取播放信息的界面

## 开发

```sh
pnpm install
pnpm dev
```

如果 Electron 二进制下载超时（GitHub 发布文件服务器偶发 504），重试即可；持续失败时再用镜像：

```sh
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ pnpm install
```

## 本地打包

```sh
pnpm dist:mac   # 或 dist:win、dist:linux，产物在 release/
```

`openhongguo` 在运行时读取 `dist/openhongguo.wasm`，所以 `electron-builder.yml` 的 `asarUnpack` 包含 `node_modules/openhongguo/dist/**`。

## 签名服务（可选）

默认用 SDK 内置签名。内置签名失效时（例如红果 App 升级后签名算法变化，表现为接口返回空结果或播放取址失败），可以部署 [openhongguo-signer](https://github.com/beilunyang/openhongguo/blob/main/signer/README.md)（Docker 镜像 `beilunyang/openhongguo-signer`），启动应用前设置环境变量：

```sh
OHG_SIGNER_URL=https://signer.example.com OHG_SIGNER_TOKEN=xxx pnpm dev
```

- `OHG_SIGNER_TOKEN` 只在签名服务设置了 `SIGNER_TOKEN` 时需要。
- 启用后设备档案改存 `userData/anonymous-signer.json`，与内置签名的档案分开。
- 签名服务不可用时接口报 `SIGNER_UNAVAILABLE`，不会回退到内置签名。

## 发布

1. 修改 `package.json` 的 `version`（例如 `1.0.1`），提交并推送。
2. 打同版本的 tag 并推送：`git tag v1.0.1 && git push origin v1.0.1`。
3. `.github/workflows/package.yml` 会同时在 Windows 和 macOS（arm64）上打包，完成后创建一个**草稿** Release，附带安装包和 `latest.yml`、`latest-mac.yml`。tag 与 `package.json` 版本不一致时工作流会失败。
4. 检查草稿后编辑并 Publish 这个草稿，**不要另外新建 Release**（同 tag 的空 Release 会成为 latest，应用检查更新时拿不到 `latest*.yml`）。应用的自动更新只读取最新的已发布 Release，草稿不会影响用户。
5. 仓库必须保持 public：应用未登录访问 `releases/latest/download/latest*.yml`，私有仓库会返回 404。

也可以在 Actions 页面手动运行 `Package`，只生成构建产物，不创建 Release。

## 自动更新

- 实现在 `src/main/updater`，没有使用 electron-updater，因为 macOS 应用没有签名，无法用 Squirrel.Mac。
- 启动 10 秒后检查一次，之后每 4 小时检查一次；菜单「检查更新…」（macOS 在应用菜单，Windows 在帮助菜单）可手动检查。
- 发现新版本后，侧栏底部出现更新卡片：点击下载，校验 SHA-512 后点击重启并安装。
- Windows 静默运行 NSIS 安装包；macOS 解压 zip 后替换 `.app` 并重新打开，应用需放在可写的目录（如「应用程序」），且不能直接从 DMG 里运行。
- 更新源来自打包时写入的 `app-update.yml`（`electron-builder.yml` 的 `publish`）。开发时可设置 `HONGGUO_UPDATE_URL` 指向一个存放 `latest-mac.yml` 和安装包的静态目录来测试。
- 应用未签名，首次打开 macOS 会提示已损坏，需执行：`xattr -dr com.apple.quarantine /Applications/HongguoDesktop.app`。

## 免责声明

`openhongguo` 为非官方 SDK，仅供学习和研究，禁止用于商业用途。
