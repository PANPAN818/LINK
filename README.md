# Link

Link 是一个移动端优先的 Vue 3 + Vite + PWA 角色扮演聊天应用原型，界面参考 LINK 的 Home、Chats、VOOM 与聊天房间体验。

## 功能

- 五个底部 Tab：主页、聊天、VOOM、Music、Fanfic。
- 同一个 conversation 支持线上聊天和线下长文本 RP 两种渲染。
- 进入线下模式会切换会话模式与提示词，退出后切回线上模式。
- 用户人设、角色名称、头像、角色资料、朋友圈频率可编辑。
- IndexedDB 本地存储用户、角色、会话、消息、VOOM、世界书和 API 设置。
- 设置页的备份分栏支持本地 JSON 导出/导入，以及 GitHub 私有仓库自动备份。
- 世界书分为线上全局、线下全局、局部世界书；每本世界书支持多个可单独开关的条目、绿灯关键词触发、蓝灯常驻注入和黄灯优先注入，局部世界书可绑定到角色。
- VOOM 可手动生成，也可在 AI 回复后按角色频率低频自动生成。
- PWA manifest 与 service worker 已配置，可在移动浏览器安装。

## API

主页右上角设置按钮里可以配置 OpenAI 兼容接口：

- `API Endpoint`：例如 `/v1/chat/completions` 兼容地址。
- `API Key`：请求时作为 Bearer token 发送。
- `Model`：传给接口的模型名。

如果不填写接口，应用会使用本地模拟回复，方便先调 UI 和流程。

## 数据备份

设置页底部的“备份”分栏提供三种数据保护方式：

- `导出备份`：下载当前 IndexedDB 快照，包含用户、角色、会话、消息、VOOM、世界书、Stickers 与设置。
- `导入备份`：选择此前导出的 JSON 文件并替换当前本地数据。
- `GitHub Login`：如果配置了 `VITE_GITHUB_OAUTH_CLIENT_ID`，会打开 GitHub OAuth 授权页；未配置时会打开 GitHub classic token 创建页。
- `GitHub 自动备份`：填写 token 后连接账号，一键创建私有仓库，并按自定义分钟间隔把备份写入仓库文件。

GitHub token 需要具备创建私有仓库和写入仓库内容的权限。备份文件会清空 `settings.githubBackup.token`，避免把 token 写进本地导出或 GitHub 备份。完整的“登录后自动换取 token 并完成部署配置”需要一个后端 OAuth callback 或 GitHub App 来保存 client secret 并完成 code exchange；纯静态 PWA 不能安全完成这一步。

## 开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
npm run preview
```

## 部署到 GitHub Pages

项目已内置 GitHub Actions 工作流，推送到 GitHub 后会自动构建并发布到 GitHub Pages。

1. 在 GitHub 新建一个仓库，例如 `LINK`。
2. 在本地初始化并推送代码：

```bash
git init
git branch -M main
git add .
git commit -m "Deploy Link"
git remote add origin https://github.com/<你的 GitHub 用户名>/<仓库名>.git
git push -u origin main
```

3. 打开 GitHub 仓库的 `Settings` -> `Pages`，把 `Build and deployment` 的 `Source` 设为 `GitHub Actions`。
4. 等 `Actions` 里的 `Deploy to GitHub Pages` 跑完后，用手机打开：

```text
https://<你的 GitHub 用户名>.github.io/<仓库名>/
```

如果仓库名是 `LINK`，地址通常是：

```text
https://<你的 GitHub 用户名>.github.io/LINK/
```

## 目录

- `src/pages`：五个 Tab 页面、聊天详情和线下 RP 页面。
- `src/components`：按功能拆分的 UI 组件。
- `src/stores`：Pinia 状态与业务流程。
- `src/data`：IndexedDB、初始种子数据。
- `src/services`：提示词构建与 AI/VOOM 生成服务。
- `src/types`：领域类型定义。
