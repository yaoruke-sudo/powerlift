"""
Pydantic 数据模型 —— 与前端 types.ts 对齐
"""
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


# class ExerciseType(str, Enum):
#     """运动类型枚举，值与前端 ExerciseType 一致"""
#     BENCH_PRESS = "Bench Press"
#     SQUAT = "Squat"
#     DEADLIFT = "Deadlift"
#     SHOULDER_PRESS = "Shoulder Press"
#     LAT_PULLDOWN = "Lat Pulldown"

# 使用 str 类型代替 Enum 以支持自定义运动
ExerciseType = str


# ===== 组数据 =====
class SetDataCreate(BaseModel):
    """创建一组训练数据的请求体"""
    weight: float
    reps: int
    is_pr: bool = False


class SetDataResponse(BaseModel):
    """单组训练数据的响应"""
    id: str
    weight: float
    reps: int
    is_pr: bool = Field(alias="is_pr", default=False)


class SetDataUpdate(BaseModel):
    """更新组数据的请求体"""
    weight: Optional[float] = None
    reps: Optional[int] = None
    is_pr: Optional[bool] = None


# ===== 运动条目 =====
class ExerciseEntryCreate(BaseModel):
    """创建运动条目的请求体"""
    type: str
    chinese_name: str
    sets: list[SetDataCreate]


class ExerciseEntryResponse(BaseModel):
    """运动条目的响应"""
    id: str
    type: str
    chineseName: str  # 保持与前端字段名一致
    sets: list[SetDataResponse]


# ===== 训练会话 =====
class WorkoutSessionCreate(BaseModel):
    """创建训练会话的请求体"""
    user_id: str
    date: str  # YYYY-MM-DD
    display_date: str
    duration: int  # 分钟
    note: Optional[str] = None
    exercises: list[ExerciseEntryCreate]


class WorkoutSessionResponse(BaseModel):
    """训练会话的响应"""
    id: str
    date: str
    displayDate: str  # 保持与前端字段名一致
    duration: int
    exercises: list[ExerciseEntryResponse]


# ===== 用户信息 =====
class UserStatsResponse(BaseModel):
    """用户身体统计数据"""
    height: float
    weight: float
    bmi: float


class UserProfileResponse(BaseModel):
    """用户完整资料"""
    id: str
    name: str
    height: float
    weight: float
    bmi: float
    avatar_url: Optional[str] = None
    training_start_date: Optional[str] = None


class UserProfileUpdate(BaseModel):
    """更新用户资料的请求体"""
    name: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    bmi: Optional[float] = None
    avatar_url: Optional[str] = None


# ===== PR 记录 =====
class PRRecordResponse(BaseModel):
    """个人最佳纪录"""
    exercise_type: str
    max_weight: float


# ===== 趋势数据 =====
class TrendDataPoint(BaseModel):
    """训练趋势中的一个数据点"""
    date: str
    weight: float


# ===== 照片 =====
class UserPhotoCreate(BaseModel):
    """创建照片的请求体"""
    user_id: str
    url: str
    date: str
    label: Optional[str] = None


class UserPhotoResponse(BaseModel):
    """照片的响应"""
    id: str
    url: str
    date: str
    label: Optional[str] = None
