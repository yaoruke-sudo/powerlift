"""
数据库种子脚本 —— 插入与前端 mock 数据一致的初始数据
运行方式: cd backend && python seed.py
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

from database import supabase

# 固定 UUID，方便前端直接引用默认用户
DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"


def seed():
    print("[SEED] 开始播种数据...")

    # 1. 清理已有数据（如果存在）
    # Supabase delete 必须带 filter，使用零值 UUID 作为 neq 条件来删除所有行
    print("  清理旧数据...")
    nil_uuid = "00000000-0000-0000-0000-000000000000"
    supabase.table("user_photos").delete().neq("id", nil_uuid).execute()
    supabase.table("pr_records").delete().neq("id", nil_uuid).execute()
    supabase.table("set_records").delete().neq("id", nil_uuid).execute()
    supabase.table("exercise_entries").delete().neq("id", nil_uuid).execute()
    supabase.table("workout_sessions").delete().neq("id", nil_uuid).execute()
    supabase.table("user_profiles").delete().neq("id", nil_uuid).execute()

    # 2. 创建默认用户
    print("  创建用户...")
    supabase.table("user_profiles").insert({
        "id": DEFAULT_USER_ID,
        "name": "李强",
        "height": 180,
        "weight": 85.0,
        "bmi": 26.2,
        "avatar_url": "https://picsum.photos/seed/powerlift/200/200",
        "training_start_date": "2024-08-01",
    }).execute()

    # 3. 创建训练记录 —— 与前端硬编码数据一致
    print("  创建训练记录...")

    # Session 1: 2024-10-24 卧推
    s1 = supabase.table("workout_sessions").insert({
        "user_id": DEFAULT_USER_ID,
        "date": "2024-10-24",
        "display_date": "Thursday, Oct 24",
        "duration": 45,
    }).execute().data[0]

    e1 = supabase.table("exercise_entries").insert({
        "session_id": s1["id"],
        "type": "Bench Press",
        "chinese_name": "杠铃卧推",
        "sort_order": 0,
    }).execute().data[0]

    for idx, (w, r, pr) in enumerate([
        (50, 12, False), (60, 10, False), (70, 8, True), (70, 6, False)
    ]):
        supabase.table("set_records").insert({
            "exercise_id": e1["id"],
            "weight": w,
            "reps": r,
            "is_pr": pr,
            "sort_order": idx,
        }).execute()

    # Session 2: 2024-10-26 深蹲
    s2 = supabase.table("workout_sessions").insert({
        "user_id": DEFAULT_USER_ID,
        "date": "2024-10-26",
        "display_date": "Saturday, Oct 26",
        "duration": 60,
    }).execute().data[0]

    e2 = supabase.table("exercise_entries").insert({
        "session_id": s2["id"],
        "type": "Squat",
        "chinese_name": "深蹲",
        "sort_order": 0,
    }).execute().data[0]

    for idx, (w, r, pr) in enumerate([
        (100, 5, False), (120, 3, False), (140, 1, True)
    ]):
        supabase.table("set_records").insert({
            "exercise_id": e2["id"],
            "weight": w,
            "reps": r,
            "is_pr": pr,
            "sort_order": idx,
        }).execute()

    # 补充更多历史训练用于趋势图
    training_history = [
        ("2024-11-01", "Friday, Nov 1", 50, "Bench Press", "杠铃卧推", [(80, 5), (80, 4)]),
        ("2024-11-15", "Friday, Nov 15", 45, "Bench Press", "杠铃卧推", [(85, 5), (85, 3)]),
        ("2024-12-01", "Sunday, Dec 1", 55, "Bench Press", "杠铃卧推", [(90, 4), (90, 3)]),
        ("2024-12-15", "Sunday, Dec 15", 50, "Bench Press", "杠铃卧推", [(100, 3), (100, 2)]),
        ("2024-11-01", "Friday, Nov 1", 60, "Squat", "深蹲", [(110, 5), (110, 4)]),
        ("2024-11-15", "Friday, Nov 15", 55, "Squat", "深蹲", [(120, 5), (120, 3)]),
        ("2024-12-01", "Sunday, Dec 1", 65, "Squat", "深蹲", [(130, 3), (130, 2)]),
        ("2024-12-15", "Sunday, Dec 15", 60, "Squat", "深蹲", [(140, 3), (140, 1)]),
        ("2024-11-01", "Friday, Nov 1", 50, "Deadlift", "硬拉", [(130, 3), (130, 2)]),
        ("2024-11-15", "Friday, Nov 15", 55, "Deadlift", "硬拉", [(140, 3), (140, 2)]),
        ("2024-12-01", "Sunday, Dec 1", 50, "Deadlift", "硬拉", [(155, 2), (155, 1)]),
        ("2024-12-15", "Sunday, Dec 15", 55, "Deadlift", "硬拉", [(160, 2), (160, 1)]),
        ("2024-11-01", "Friday, Nov 1", 40, "Shoulder Press", "哑铃推举", [(40, 8), (40, 6)]),
        ("2024-11-15", "Friday, Nov 15", 45, "Shoulder Press", "哑铃推举", [(45, 6), (45, 5)]),
        ("2024-12-01", "Sunday, Dec 1", 40, "Shoulder Press", "哑铃推举", [(50, 5), (50, 4)]),
        ("2024-12-15", "Sunday, Dec 15", 45, "Shoulder Press", "哑铃推举", [(55, 5), (55, 3)]),
    ]

    for date, display, dur, ex_type, cn_name, sets_data in training_history:
        s = supabase.table("workout_sessions").insert({
            "user_id": DEFAULT_USER_ID,
            "date": date,
            "display_date": display,
            "duration": dur,
        }).execute().data[0]

        e = supabase.table("exercise_entries").insert({
            "session_id": s["id"],
            "type": ex_type,
            "chinese_name": cn_name,
            "sort_order": 0,
        }).execute().data[0]

        for idx, (w, r) in enumerate(sets_data):
            supabase.table("set_records").insert({
                "exercise_id": e["id"],
                "weight": w,
                "reps": r,
                "is_pr": False,
                "sort_order": idx,
            }).execute()

    # 4. 创建 PR 记录 —— 与前端 PR_RECORDS 一致
    print("  创建 PR 记录...")
    for ex_type, max_weight in [
        ("Bench Press", 100),
        ("Squat", 140),
        ("Deadlift", 160),
        ("Shoulder Press", 60),
    ]:
        supabase.table("pr_records").insert({
            "user_id": DEFAULT_USER_ID,
            "exercise_type": ex_type,
            "max_weight": max_weight,
            "achieved_at": "2024-12-15",
        }).execute()

    # 5. 创建照片 —— 与前端 MOCK_PHOTOS 一致
    print("  创建照片...")
    photos = [
        ("https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop", "2024-11-01", "Day 1: 起步"),
        ("https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=400&auto=format&fit=crop", "2024-11-15", "Week 2: 状态回升"),
        ("https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400&auto=format&fit=crop", "2024-12-01", "Month 1: 肌肉泵感"),
        ("https://images.unsplash.com/photo-1599058917233-35833f39a0f2?q=80&w=400&auto=format&fit=crop", "2024-12-15", "Day 45: 极限突破"),
        ("https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=400&auto=format&fit=crop", "2024-12-28", "Year End: 蜕变"),
    ]
    for url, date, label in photos:
        supabase.table("user_photos").insert({
            "user_id": DEFAULT_USER_ID,
            "url": url,
            "date": date,
            "label": label,
        }).execute()

    print("[DONE] 种子数据播种完成！")
    print(f"   默认用户 ID: {DEFAULT_USER_ID}")


if __name__ == "__main__":
    seed()
