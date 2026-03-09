"""
通过 Supabase REST API 测试连接和检查表
运行方式: cd backend && python setup_db.py
"""
import httpx
import os
import sys
from dotenv import load_dotenv

# 修复 Windows 控制台编码
sys.stdout.reconfigure(encoding='utf-8')

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")


def testConnection():
    """测试 Supabase 连接是否正常"""
    url = f"{SUPABASE_URL}/rest/v1/"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    try:
        resp = httpx.get(url, headers=headers, timeout=10)
        print(f"[OK] Supabase 连接成功! 状态码: {resp.status_code}")
        return True
    except Exception as e:
        print(f"[FAIL] Supabase 连接失败: {e}")
        return False


def checkTables():
    """检查表是否已经存在"""
    tables = ["user_profiles", "workout_sessions", "exercise_entries", "set_records", "pr_records", "user_photos"]
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }

    allExist = True
    for table in tables:
        url = f"{SUPABASE_URL}/rest/v1/{table}?select=count&limit=0"
        try:
            resp = httpx.get(url, headers=headers, timeout=10)
            if resp.status_code == 200:
                print(f"  [OK] 表 {table} 存在")
            else:
                print(f"  [MISSING] 表 {table} 不存在 (状态码: {resp.status_code})")
                allExist = False
        except Exception as e:
            print(f"  [ERROR] 检查表 {table} 失败: {e}")
            allExist = False
    return allExist


if __name__ == "__main__":
    print("--- 测试 Supabase 连接 ---")
    if testConnection():
        print("\n--- 检查数据库表 ---")
        if checkTables():
            print("\n[OK] 所有表都已存在，可以运行 seed.py 插入种子数据")
        else:
            print("\n[WARN] 某些表不存在。请在 Supabase Dashboard SQL Editor 中执行 schema.sql 脚本")
