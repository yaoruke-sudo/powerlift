"""
统计数据 API —— PR 记录和训练趋势图表数据
"""
from fastapi import APIRouter, Query
from backend.database import supabase
from backend.schemas import PRRecordResponse, TrendDataPoint

router = APIRouter(prefix="/api/stats", tags=["统计"])


@router.get("/pr", response_model=dict[str, float])
async def getPrRecords(user_id: str = Query(..., description="用户 ID")):
    """
    获取用户所有 PR 记录
    返回格式：{ "Bench Press": 100, "Squat": 140, ... }
    与前端 PR_RECORDS 常量结构一致
    """
    result = (
        supabase.table("pr_records")
        .select("exercise_type,max_weight")
        .eq("user_id", user_id)
        .execute()
    )
    return {row["exercise_type"]: row["max_weight"] for row in result.data}


@router.get("/trends", response_model=list[TrendDataPoint])
async def getTrends(
    user_id: str = Query(..., description="用户 ID"),
    exercise_type: str = Query(..., description="运动类型，如 Bench Press"),
):
    """
    获取某运动类型的训练趋势
    从历史训练记录中提取每次训练的最大重量，按日期排序
    """
    # 查找该用户所有包含指定运动的训练记录
    sessions = (
        supabase.table("workout_sessions")
        .select("id,date")
        .eq("user_id", user_id)
        .order("date")
        .execute()
    )

    trend_data: list[TrendDataPoint] = []

    for session in sessions.data:
        # 查找该运动条目
        exercises = (
            supabase.table("exercise_entries")
            .select("id")
            .eq("session_id", session["id"])
            .eq("type", exercise_type)
            .execute()
        )

        for ex in exercises.data:
            # 获取该运动的最大重量
            sets = (
                supabase.table("set_records")
                .select("weight")
                .eq("exercise_id", ex["id"])
                .order("weight", desc=True)
                .limit(1)
                .execute()
            )
            if sets.data:
                # 日期格式化为 MM/DD，与前端图表一致
                date_parts = session["date"].split("-")
                formatted_date = f"{date_parts[1]}/{date_parts[2]}"
                trend_data.append(
                    TrendDataPoint(date=formatted_date, weight=sets.data[0]["weight"])
                )

    return trend_data
