# Git 管理说明

Git 的作用可以理解成“代码时间机器 + 协作记录本”。它不会替你写代码，但能把每一次修改保存成清楚的节点，让你知道改了什么、为什么改、谁改的，并且在出问题时能回到以前的版本。

## Git 管理的目的

- 保留历史：每次提交都是一个可追溯的快照。
- 方便回滚：如果一次改动导致 Bug，可以定位并撤回那次改动。
- 保护代码：本地电脑出问题时，推送到远程仓库后还能找回来。
- 分清责任：提交信息能说明某次修改解决了什么问题。
- 支持协作：多人或 AI 助手改代码时，可以通过分支和提交减少互相覆盖。
- 帮助排错：`git diff` 和历史提交能快速看出最近改动范围。

## 常见概念

| 名词 | 含义 |
| --- | --- |
| working tree | 当前文件夹里还没提交的修改 |
| stage/index | 准备放进下一次提交的修改 |
| commit | 一次带说明的代码快照 |
| branch | 一条独立修改线，比如 `main` 或 `codex/fix-login` |
| remote | 远程仓库，比如 GitHub 上的 `origin` |
| push | 把本地提交上传到远程仓库 |
| pull | 把远程新提交拉到本地 |
| .gitignore | 告诉 Git 哪些本地文件不要管 |

## 这个项目的建议流程

每次改代码前：

```bash
git status --short --branch
```

如果要做一个较大的功能或修 Bug，建议开新分支：

```bash
git switch -c codex/short-task-name
```

改完后先验证：

```bash
npm run build
```

查看改了什么：

```bash
git diff
```

提交：

```bash
git add 需要提交的文件
git commit -m "docs: add project architecture notes"
```

需要同步到 GitHub 时：

```bash
git push
```

## 提交信息建议

使用短小清楚的英文或中文都可以，建议带类型：

- `feat: add workout calendar`
- `fix: correct PR calculation`
- `docs: add project architecture notes`
- `style: polish dashboard layout`
- `chore: update android assets`

## 什么应该提交

- `App.tsx`, `pages/`, `components/`, `services/`, `types.ts`, `constants.ts`
- `package.json` 和 `package-lock.json`
- `backend/` 源码和 schema
- `android/` 中确实需要纳入版本管理的原生配置、图标、启动图
- `docs/` 文档
- `README.md`, `AGENTS.md`, `.gitignore`, `.gitattributes`

## 什么不要提交

- `.env`, `.env.local`
- `node_modules/`
- `dist/`
- 日志文件，例如 `*.log`
- 本机 IDE 缓存，例如 `.idea/`
- 本地调试数据库，例如 `*.db`, `*.sqlite3`
- 本地 Codex/plugin 工具目录，例如 `plugins/`

## 你以后可以怎么让我帮你

你可以直接说：

- “帮我看一下当前 Git 状态”
- “帮我把这次改动提交到 Git”
- “帮我新开一个分支修这个 Bug”
- “帮我看最近一次提交改了什么”
- “帮我把本地代码推送到 GitHub”

我处理 Git 时会先看状态、确认没有明显秘密文件，再提交。推送到 GitHub 属于把代码上传到远程，我会在你明确要“推送”或“同步到 GitHub”时再做。

