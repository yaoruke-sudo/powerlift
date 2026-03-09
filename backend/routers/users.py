"""
用户信息 API —— 管理用户基本资料和身体数据
"""
from fastapi import APIRouter, HTTPException
from backend.database import supabase
from backend.schemas import UserProfileResponse, UserProfileUpdate, UserStatsResponse

router = APIRouter(prefix="/api/users", tags=["用户"])


@router.get("/{user_id}", response_model=UserProfileResponse)
async def getUser(user_id: str):
    """获取用户完整资料"""
    result = supabase.table("user_profiles").select("*").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="用户不存在")
    row = result.data[0]
    return UserProfileResponse(
        id=row["id"],
        name=row["name"],
        height=row["height"],
        weight=row["weight"],
        bmi=row["bmi"],
        avatar_url=row.get("avatar_url"),
        training_start_date=str(row.get("training_start_date", ""))
    )


@router.get("/{user_id}/stats", response_model=UserStatsResponse)
async def getUserStats(user_id: str):
    """获取用户身体统计数据（仅身高/体重/BMI）"""
    result = supabase.table("user_profiles").select("height,weight,bmi").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="用户不存在")
    row = result.data[0]
    return UserStatsResponse(height=row["height"], weight=row["weight"], bmi=row["bmi"])


@router.put("/{user_id}", response_model=UserProfileResponse)
async def updateUser(user_id: str, body: UserProfileUpdate):
    """更新用户资料（部分更新）"""
    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="没有需要更新的字段")

    # 身高体重变化时自动计算 BMI
    if "height" in update_data or "weight" in update_data:
        current = supabase.table("user_profiles").select("height,weight").eq("id", user_id).execute()
        if current.data:
            h = update_data.get("height", current.data[0]["height"])
            w = update_data.get("weight", current.data[0]["weight"])
            update_data["bmi"] = round(w / ((h / 100) ** 2), 1)

    result = supabase.table("user_profiles").update(update_data).eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="用户不存在")
    row = result.data[0]
    return UserProfileResponse(
        id=row["id"],
        name=row["name"],
        height=row["height"],
        weight=row["weight"],
        bmi=row["bmi"],
        avatar_url=row.get("avatar_url"),
        training_start_date=str(row.get("training_start_date", ""))
    )
