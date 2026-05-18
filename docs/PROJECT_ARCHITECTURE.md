# PowerLift 项目架构说明

这份文档是给以后维护、改代码、排查 Bug 时看的项目地图。当前项目是一个力量训练记录应用：前端是 Vite + React + TypeScript，移动端通过 Capacitor 打包 Android，数据默认保存在浏览器/手机本地 IndexedDB；仓库里也保留了 FastAPI + Supabase 后端代码，适合未来切回云端同步。

## 总览

| 层级 | 主要文件/目录 | 作用 |
| --- | --- | --- |
| 应用入口 | `index.tsx`, `App.tsx` | 挂载 React 应用，维护当前页面、导航栈、隐私弹窗、全局训练数据 |
| 页面 | `pages/` | 仪表盘、记录训练、训练总结、日历、个人资料、启动页、隐私政策 |
| 组件 | `components/` | 底部导航、隐私弹窗、微交互、3D 背景、ReactBits 动效组件 |
| 类型与常量 | `types.ts`, `constants.ts` | 前端数据契约、动作枚举、动作中文名、隐私信息 |
| 数据 API | `services/api.ts` | 页面调用的业务 API 门面，负责训练、用户、PR、趋势、照片等功能 |
| 本地存储 | `services/db.ts` | IndexedDB 封装，当前默认数据落点 |
| 后端 | `backend/` | FastAPI 路由、Pydantic schema、Supabase schema，当前不是前端默认数据通道 |
| 移动端 | `capacitor.config.ts`, `android/` | Capacitor 配置和 Android 原生工程 |
| 样式 | `index.css` | Tailwind 入口、全局视觉、移动端壳层、动画样式 |
| 图标/素材 | `assets/`, `store-assets/`, Android `res/mipmap-*` | 应用图标、商店素材、Android 启动图与图标 |

## 运行方式

前端开发：

```bash
npm install
npm run dev
```

前端构建：

```bash
npm run build
```

Android 同步：

```bash
npm run build
npx cap sync android
```

后端开发备用：

```bash
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

## 前端导航结构

`App.tsx` 是当前应用的导航中心，没有使用 React Router。核心状态包括：

- `currentView`: 当前页面，类型来自 `ViewState`。
- `viewHistoryRef`: 简单页面历史栈，用于 Android 返回键。
- `selectedSession`: 当前查看的训练记录。
- `targetDate`: 从日历或总结页进入记录页时指定日期。
- `userStats`: 身高、体重、BMI。
- `workoutHistory`: 本地所有训练记录。
- `privacyAgreed` / `showPrivacyDialog`: 首次启动隐私同意流程。

页面切换由 `navigateTo`、`goToDashboard`、`handleHardwareBack` 控制。新增页面时，通常需要同时改：

- `types.ts` 的 `ViewState`
- `App.tsx` 的 `renderView`
- 相关导航入口，例如 `BottomNav.tsx` 或页面按钮

## 页面职责

| 页面 | 文件 | 主要职责 |
| --- | --- | --- |
| 启动页 | `pages/Splash.tsx` | 首屏进入应用，触发隐私弹窗或进入仪表盘 |
| 仪表盘 | `pages/Dashboard.tsx` | 展示用户统计、PR、趋势图，并支持部分资料更新 |
| 记录训练 | `pages/RecordWorkout.tsx` | 创建一次训练，组织动作、组数、重量、次数，保存后回到总结 |
| 训练总结 | `pages/WorkoutSummary.tsx` | 查看某天训练，编辑/删除单组数据，删除训练 |
| 日历 | `pages/CalendarView.tsx` | 按日期查看训练，有数据进总结，无数据进记录 |
| 个人资料 | `pages/ProfileView.tsx` | 用户资料、头像/照片、训练天数、照片增删改 |
| 隐私政策 | `pages/PrivacyPolicyView.tsx` | App 内隐私政策展示 |

## 数据流

当前默认数据流：

```text
React 页面
  -> services/api.ts
    -> services/db.ts
      -> IndexedDB: PowerLiftDB
```

`services/api.ts` 是页面层依赖的业务接口，建议以后优先保持这个边界稳定。这样无论数据落在 IndexedDB、FastAPI、Supabase 还是其他服务，页面代码都不需要大面积重写。

IndexedDB 数据库名是 `PowerLiftDB`，版本号目前为 `1`，包含这些 object store：

- `users`: 用户资料
- `workouts`: 训练记录，带 `date` 和 `user_id` 索引
- `photos`: 用户照片，带 `user_id` 索引

默认单用户 ID 在 `services/api.ts`：

```ts
DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001'
```

## 核心数据模型

前端类型集中在 `types.ts`：

- `UserProfile`: 用户资料，包含姓名、身高、体重、BMI、头像、训练开始日期。
- `UserStats`: 仪表盘使用的身高、体重、BMI 摘要。
- `WorkoutSession`: 一次训练，包含日期、展示日期、时长和动作列表。
- `ExerciseEntry`: 一个训练动作，包含动作类型、中文名和组数据。
- `SetData`: 单组重量、次数、PR 标记。
- `UserPhoto`: 用户照片、日期和标签。

字段命名要注意：

- UI 层使用 `displayDate`, `chineseName`, `isPR` 等 camelCase 字段。
- 创建训练 payload 使用 `display_date`, `chinese_name`, `is_pr` 等 snake_case 字段。
- `services/api.ts` 负责在两种命名之间做转换。

## 主要业务流程

启动加载：

```text
App.tsx -> loadData()
  -> fetchUserStats(DEFAULT_USER_ID)
  -> fetchWorkouts(DEFAULT_USER_ID)
  -> 更新 userStats / workoutHistory
```

保存训练：

```text
RecordWorkout.tsx
  -> createWorkout(payload)
  -> services/api.ts 计算 PR 并生成 ID
  -> services/db.ts 写入 IndexedDB
  -> App.handleWorkoutSaved 更新本地列表并跳转总结页
```

查看/编辑训练：

```text
CalendarView.tsx 或 Dashboard.tsx
  -> App 设置 targetDate / selectedSession
  -> WorkoutSummary.tsx
  -> updateSet/deleteSet/deleteWorkout
  -> onDataChanged 触发 App 重新加载
```

资料和照片：

```text
ProfileView.tsx
  -> fetchUserProfile/updateUserProfile
  -> fetchPhotos/createPhoto/updatePhoto/deletePhoto
  -> services/db.ts 写入 users/photos
```

PR 和趋势：

```text
Dashboard.tsx
  -> fetchPrRecords: 从本地 workoutHistory 重新计算各动作最大重量
  -> fetchTrends: 按动作提取每次训练的最大重量生成图表点
```

## 后端代码状态

`backend/` 是 FastAPI + Supabase 方案：

- `backend/main.py`: 创建 FastAPI app、CORS、注册路由、健康检查。
- `backend/database.py`: 创建 Supabase 客户端。
- `backend/schemas.py`: Pydantic 请求/响应模型。
- `backend/routers/users.py`: 用户资料和统计接口。
- `backend/routers/workouts.py`: 训练记录、动作、组数据接口。
- `backend/routers/stats.py`: PR 和趋势接口。
- `backend/routers/photos.py`: 用户照片接口。
- `backend/schema.sql`: Supabase 建表、索引、RLS policy。

当前前端没有直接调用 HTTP 后端，而是通过 `services/api.ts` 调 IndexedDB。以后如果要切回后端，优先改 `services/api.ts`，尽量不要让页面直接 `fetch` 后端接口。

## Android / Capacitor

关键文件：

- `capacitor.config.ts`: App ID、App 名称、`webDir: 'dist'`。
- `android/app/src/main/AndroidManifest.xml`: Android 主 Activity 和 FileProvider。
- `android/app/src/main/res/mipmap-*`: 各分辨率启动图标。
- `generate-icon.cjs`: 图标生成脚本。

移动端流程通常是：

```bash
npm run build
npx cap sync android
```

如果只改 React 页面或样式，先 `npm run build`。如果改了 Capacitor、Android 图标、权限或原生配置，再同步 Android。

## 排查 Bug 的优先路线

- 页面跳转问题：先看 `App.tsx` 的 `navigateTo`、`viewHistoryRef`、`renderView`。
- 数据没保存：先看 `services/api.ts` 的业务函数，再看 `services/db.ts` 的 IndexedDB 写入。
- 数据显示为空：检查浏览器开发者工具里的 IndexedDB `PowerLiftDB`，并确认 `DEFAULT_USER_ID` 是否一致。
- PR/趋势异常：看 `fetchPrRecords`、`fetchTrends`，它们是从本地训练记录动态计算的。
- 日期跳转异常：看 `targetDate`、`selectedSession`、`CalendarView.tsx`、`WorkoutSummary.tsx` 的交互。
- Android 返回键异常：看 `App.tsx` 的 `handleHardwareBack`。
- Android 图标/启动图异常：看 `generate-icon.cjs`、`assets/`、`android/app/src/main/res/`。

## 已知维护注意点

- 仓库里中文内容在某些 PowerShell 输出中可能显示乱码；编辑文档和源码时优先保持 UTF-8。
- `services/db.ts` 的 `dbUpdateSet` 和 `dbDeleteSet` 会扫描全部训练记录。对个人本地数据量足够简单，但如果以后数据变多，可以考虑建立更细索引或调整数据结构。
- 后端 Supabase schema 当前 RLS policy 是开发友好策略，不适合作为多用户生产安全模型。
- `backend/` 和当前 IndexedDB 前端不是同一条默认运行链路，改一边时要确认是否需要同步另一边的数据模型。

