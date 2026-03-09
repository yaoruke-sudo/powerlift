<div align="center">

# 🏋️ 练 PowerLift

**一个为健身爱好者打造的力量训练追踪应用**

*「今天别忘喝肌酸，明天也别忘」—— 姚大大可*

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com/)

</div>

---

## 💡 灵感来源

作为一个健身爱好者，每次去健房最头疼的事情就是——**上次卧推推了多少来着？**

一直以来都是用手机备忘录记录训练数据，不仅查找麻烦，格式杂乱，更看不到自己的进步趋势。市面上的健身 App 要么功能太复杂，要么充斥着广告和付费墙。

恰逢 AI 辅助编程工具日渐成熟，作为一个**非计算机专业**的普通人，我决定借助 AI 的力量亲手打造一个属于自己的训练追踪工具。从零开始构思、设计、编码到打包上架——**这是我的第一个独立开发程序**，也是用代码记录下的一段健身旅程。

> 不管怎么说，能行动起来就很厉害。

---

## ✨ 功能特性

| 功能 | 描述 |
|------|------|
| 📝 **训练记录** | 快速记录每组重量、次数，支持力量训练和有氧爬坡 |
| 📊 **数据可视化** | 趋势折线图，直观展示力量增长曲线 |
| 🏆 **PR 追踪** | 自动记录个人最佳 (Personal Record)，突破时高亮提示 |
| 📅 **日历视图** | 按日期浏览训练历史，一目了然 |
| 👤 **个人资料** | 记录身高体重，自动计算 BMI |
| 📸 **体态照片** | 上传体态对比照，见证身体变化 |
| 🔒 **隐私保护** | 首次启动隐私政策同意弹窗，合规设计 |

---

## 🛠 技术栈

### 前端
- **React 19** + **TypeScript** — 类型安全的现代前端框架
- **Vite** — 极速开发构建工具
- **TailwindCSS 4** — 原子化 CSS 框架
- **Recharts** — 数据可视化图表库
- **Material Icons** — Google Material Design 图标

### 后端
- **FastAPI** — 高性能 Python Web 框架
- **Supabase** (PostgreSQL) — 云端数据库服务

### 移动端
- **Capacitor** — 将 Web 应用打包为原生 Android App

---

## 📱 支持的训练动作

| 类型 | 动作 |
|------|------|
| 胸部 | 杠铃卧推、哑铃上斜推举、器械推胸、飞鸟 |
| 背部 | 引体向上、高位下拉、器械划船、反向飞鸟 |
| 肩部 | 哑铃推肩 |
| 有氧 | 有氧爬坡（记录时长、坡度、速度） |

---

## 🚀 本地运行

### 前端

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 后端

```bash
# 安装 Python 依赖
pip install -r backend/requirements.txt

# 启动后端服务
uvicorn backend.main:app --reload
```

### 环境变量

在项目根目录创建 `.env.local` 文件：

```env
GEMINI_API_KEY=your_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

---

## 📁 项目结构

```
powerlift/
├── App.tsx                 # 应用主入口，路由管理
├── index.tsx               # React 挂载点
├── types.ts                # TypeScript 类型定义
├── constants.ts            # 常量配置（动作列表等）
├── pages/
│   ├── Splash.tsx          # 启动页（语录轮播）
│   ├── Dashboard.tsx       # 仪表盘（统计概览 + 趋势图）
│   ├── RecordWorkout.tsx   # 训练记录页
│   ├── WorkoutSummary.tsx  # 训练总结页
│   ├── CalendarView.tsx    # 日历视图
│   ├── ProfileView.tsx     # 个人资料页
│   └── PrivacyPolicyView.tsx # 隐私政策页
├── components/
│   └── PrivacyDialog.tsx   # 隐私政策同意弹窗
├── services/
│   └── api.ts              # API 请求封装
├── backend/
│   ├── main.py             # FastAPI 主入口
│   ├── schema.sql          # 数据库建表脚本
│   ├── schemas.py          # Pydantic 数据模型
│   └── routers/            # API 路由模块
├── android/                # Capacitor Android 原生工程
└── package.json
```

---

## 📝 开发感想

这个项目从一个简单的想法——「我只是想记住上次卧推的重量」——起步，最终成长为一个完整的全栈应用。

作为第一次开发经历，这个过程让我深刻体会到：**技术不再是少数人的专利，AI 正在让每个有想法的人都能把灵感变成现实。**

---

<div align="center">

**用代码记录力量，用数据见证成长 💪**

*Made with ❤️ by 姚大大可*

</div>
