"""
用户照片 API —— 管理照片墙数据
"""
from fastapi import APIRouter, HTTPException, Query
from backend.database import supabase
from backend.schemas import UserPhotoCreate, UserPhotoResponse

router = APIRouter(prefix="/api/photos", tags=["照片"])


@router.get("", response_model=list[UserPhotoResponse])
async def listPhotos(user_id: str = Query(..., description="用户 ID")):
    """获取用户照片列表（按日期倒序）"""
    result = (
        supabase.table("user_photos")
        .select("*")
        .eq("user_id", user_id)
        .order("date", desc=True)
        .execute()
    )
    return [
        UserPhotoResponse(id=r["id"], url=r["url"], date=r["date"], label=r.get("label"))
        for r in result.data
    ]


@router.post("", response_model=UserPhotoResponse, status_code=201)
async def createPhoto(body: UserPhotoCreate):
    """添加一张照片"""
    result = (
        supabase.table("user_photos")
        .insert({
            "user_id": body.user_id,
            "url": body.url,
            "date": body.date,
            "label": body.label,
        })
        .execute()
    )
    row = result.data[0]
    return UserPhotoResponse(id=row["id"], url=row["url"], date=row["date"], label=row.get("label"))


@router.delete("/{photo_id}", status_code=204)
async def deletePhoto(photo_id: str):
    """删除一张照片"""
    result = supabase.table("user_photos").select("id").eq("id", photo_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="照片不存在")
    supabase.table("user_photos").delete().eq("id", photo_id).execute()
