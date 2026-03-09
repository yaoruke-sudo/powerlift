"""
应用配置 —— 从环境变量中读取 Supabase 凭证
"""
import os
from dotenv import load_dotenv

# 加载项目根目录的 .env.local
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("缺少 SUPABASE_URL 或 SUPABASE_KEY 环境变量，请在 .env.local 中配置")
