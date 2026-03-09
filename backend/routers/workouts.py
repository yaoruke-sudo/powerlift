"""
训练记录 API —— 管理训练会话、运动条目和组数据
核心业务逻辑：创建训练记录时级联插入运动条目和组数据
"""
from fastapi import APIRouter, HTTPException, Query
from backend.database import supabase
from backend.schemas import (
    WorkoutSessionCreate,
    WorkoutSessionResponse,
    ExerciseEntryResponse,
    SetDataResponse,
    SetDataUpdate,
)

router = APIRouter(prefix="/api/workouts", tags=["训练"])


def _buildSessionResponse(session: dict) -> WorkoutSessionResponse:
    """
    根据 session 行构建完整响应，嵌套查询运动条目和组数据
    采用分层查询而非 join，保证数据结构清晰
    """
    exercises_result = (
        supabase.table("exercise_entries")
        .select("*")
        .eq("session_id", session["id"])
        .order("sort_order")
        .execute()
    )

    exercises = []
    for ex in exercises_result.data:
        sets_result = (
            supabase.table("set_records")
            .select("*")
            .eq("exercise_id", ex["id"])
            .order("sort_order")
            .execute()
        )
        sets = [
            SetDataResponse(id=s["id"], weight=s["weight"], reps=s["reps"], is_pr=s["is_pr"])
            for s in sets_result.data
        ]
        exercises.append(
            ExerciseEntryResponse(
                id=ex["id"],
                type=ex["type"],
                chineseName=ex["chinese_name"],
                sets=sets,
            )
        )

    return WorkoutSessionResponse(
        id=session["id"],
        date=session["date"],
        displayDate=session["display_date"],
        duration=session["duration"],
        exercises=exercises,
    )


@router.get("", response_model=list[WorkoutSessionResponse])
async def listWorkouts(user_id: str = Query(..., description="用户 ID")):
    """获取用户所有训练记录（按日期倒序）"""
    result = (
        supabase.table("workout_sessions")
        .select("*")
        .eq("user_id", user_id)
        .order("date", desc=True)
        .execute()
    )
    return [_buildSessionResponse(s) for s in result.data]


@router.get("/{session_id}", response_model=WorkoutSessionResponse)
async def getWorkout(session_id: str):
    """获取单次训练详情"""
    result = supabase.table("workout_sessions").select("*").eq("id", session_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="训练记录不存在")
    return _buildSessionResponse(result.data[0])


@router.post("", response_model=WorkoutSessionResponse, status_code=201)
async def createWorkout(body: WorkoutSessionCreate):
    """
    创建完整训练记录（级联创建）
    流程：创建 session → 逐个创建 exercise → 逐组创建 set
    """
    # 1. 检查是否存在当天的训练会话
    existing_session = (
        supabase.table("workout_sessions")
        .select("*")
        .eq("user_id", body.user_id)
        .eq("date", body.date)
        .execute()
    )

    if existing_session.data:
        # 如果存在，使用现有会话
        session = existing_session.data[0]
        # 可选：更新 note 或 duration（累加？）
        # 这里简单起见，如果新请求有 note，则追加到现有 note
        if body.note:
            new_note = (session.get("note") or "") + "\n" + body.note
            supabase.table("workout_sessions").update({"note": new_note.strip()}).eq("id", session["id"]).execute()
        
        # 修正：我们需要知道当前最大的 sort_order，以便追加到后面
        # 但 exercise_entries 表没有 unique(session_id, sort_order) 约束，所以重复 sort_order 不会报错，但排序会乱
        # 简单起见，我们重新查询该 session 下的 entry 数量
        existing_exercises = (
            supabase.table("exercise_entries")
            .select("id", count="exact")
            .eq("session_id", session["id"])
            .execute()
        )
        base_sort_order = existing_exercises.count or 0
    else:
        # 不存在，创建新会话
        session_result = (
            supabase.table("workout_sessions")
            .insert({
                "user_id": body.user_id,
                "date": body.date,
                "display_date": body.display_date,
                "duration": body.duration,
                "note": body.note,
            })
            .execute()
        )
        session = session_result.data[0]
        base_sort_order = 0

    # 2. 逐个创建运动条目和组数据
    for idx, exercise in enumerate(body.exercises):
        ex_result = (
            supabase.table("exercise_entries")
            .insert({
                "session_id": session["id"],
                "type": exercise.type,
                "chinese_name": exercise.chinese_name,
                "sort_order": base_sort_order + idx,
            })
            .execute()
        )
        ex_row = ex_result.data[0]

        # 3. 创建每组数据
        for set_idx, set_data in enumerate(exercise.sets):
            supabase.table("set_records").insert({
                "exercise_id": ex_row["id"],
                "weight": set_data.weight,
                "reps": set_data.reps,
                "is_pr": set_data.is_pr,
                "sort_order": set_idx,
            }).execute()

            # 如果是 PR，同步更新 pr_records 表
            if set_data.is_pr:
                _updatePrRecord(body.user_id, exercise.type, set_data.weight)

    return _buildSessionResponse(session)


@router.delete("/{session_id}", status_code=204)
async def deleteWorkout(session_id: str):
    """
    删除训练记录（级联删除由数据库外键 ON DELETE CASCADE 处理）
    """
    result = supabase.table("workout_sessions").select("id").eq("id", session_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="训练记录不存在")

    supabase.table("workout_sessions").delete().eq("id", session_id).execute()


@router.put("/sets/{set_id}", response_model=SetDataResponse)
async def updateSet(set_id: str, body: SetDataUpdate):
    """
    更新组数据（重量、次数、PR状态）
    """
    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="没有需要更新的字段")

    # 1. 更新组数据
    result = supabase.table("set_records").update(update_data).eq("id", set_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="组数据不存在")
    
    updated_set = result.data[0]

    # 2. 如果更新了重量且通过 PR 检查，或者直接强制设置了 is_pr，检查是否需要更新 PR 记录
    # 这里为了简化，我们只在 is_pr=True 时尝试更新 PR 记录
    # 更严谨的逻辑可能需要查询 exercise_type，但这里 update_data 不包含 type
    # 暂时只支持更新当前 set 的 is_pr 状态，若需同步 PR 表，需要额外查询 chain
    
    if updated_set.get("is_pr"):
        # 需要获取 exercise_type 才能更新 PR 表
        # 这是一个反向查询：set -> exercise -> type
        # Supabase-py 的连表查询支持有限，分步查询
        ex_result = supabase.table("exercise_entries").select("type, session_id").eq("id", updated_set["exercise_id"]).execute()
        if ex_result.data:
            ex_type = ex_result.data[0]["type"]
            session_id = ex_result.data[0]["session_id"]
            
            # 获取 user_id
            sess_result = supabase.table("workout_sessions").select("user_id").eq("id", session_id).execute()
            if sess_result.data:
                user_id = sess_result.data[0]["user_id"]
                _updatePrRecord(user_id, ex_type, updated_set["weight"])

    return SetDataResponse(
        id=updated_set["id"],
        weight=updated_set["weight"],
        reps=updated_set["reps"],
        is_pr=updated_set["is_pr"]
    )


def _updatePrRecord(user_id: str, exercise_type: str, weight: float):
    """
    更新 PR 记录：仅当新重量大于现有记录时才更新
    使用 upsert 实现"不存在则插入，存在则更新"
    """
    existing = (
        supabase.table("pr_records")
        .select("max_weight")
        .eq("user_id", user_id)
        .eq("exercise_type", exercise_type)
        .execute()
    )

    if not existing.data or weight > existing.data[0]["max_weight"]:
        supabase.table("pr_records").upsert(
            {
                "user_id": user_id,
                "exercise_type": exercise_type,
                "max_weight": weight,
                "achieved_at": "now()",
            },
            on_conflict="user_id,exercise_type",
        ).execute()
