"""
Supabase 客户端单例 —— 全局共享连接实例
"""
from supabase import create_client, Client
from backend.config import SUPABASE_URL, SUPABASE_KEY

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
