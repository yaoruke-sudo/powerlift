"""
FastAPI 主入口 —— PowerLift 力量训练追踪后端
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import users, workouts, stats, photos

app = FastAPI(
    title="PowerLift API",
    description="力量训练追踪应用后端",
    version="1.0.0",
)

# CORS 配置，允许前端开发服务器跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由模块
app.include_router(users.router)
app.include_router(workouts.router)
app.include_router(stats.router)
app.include_router(photos.router)


@app.get("/api/health")
async def healthCheck():
    """健康检查端点"""
    return {"status": "ok", "app": "PowerLift API"}
