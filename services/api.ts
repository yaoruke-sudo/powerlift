/**
 * API 服务层 —— 封装所有数据交互
 * 已改造为纯离线模式，直接调用 IndexedDB (services/db.ts)
 */
import { WorkoutSession, UserStats, ExerciseEntry, SetData, UserPhoto, UserProfile } from '../types';
import * as db from './db';

// 默认用户 ID（单用户模式）
export const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

// ===== 用户 API =====

export async function fetchUserStats(userId: string = DEFAULT_USER_ID): Promise<UserStats> {
  const profile = await fetchUserProfile(userId);
  return {
    height: profile.height,
    weight: profile.weight,
    bmi: profile.bmi
  };
}

// 导出 UserProfile 接口已移动到 types.ts

export async function fetchUserProfile(userId: string = DEFAULT_USER_ID): Promise<UserProfile> {
  let user = await db.dbGetUser(userId);
  if (!user) {
    // 初始化默认用户
    user = {
      id: userId,
      name: 'User',
      height: 175,
      weight: 70,
      bmi: 22.9,
      avatar_url: null,
      training_start_date: new Date().toISOString()
    };
    await db.dbSaveUser(user);
  }
  return user;
}

export async function updateUserProfile(
  userId: string,
  data: Partial<{ name: string; height: number; weight: number; bmi: number; avatar_url: string }>
): Promise<UserProfile> {
  const current = await fetchUserProfile(userId);
  const updated = { ...current, ...data };
  return db.dbSaveUser(updated);
}

// ===== 训练 API =====

export async function fetchWorkouts(userId: string = DEFAULT_USER_ID): Promise<WorkoutSession[]> {
  return db.dbGetWorkouts(userId);
}

export async function fetchWorkout(sessionId: string): Promise<WorkoutSession> {
  const workout = await db.dbGetWorkout(sessionId);
  if (!workout) throw new Error('Workout not found');
  return workout;
}

export interface CreateWorkoutPayload {
  user_id: string;
  date: string;
  display_date: string;
  duration: number;
  note?: string;
  exercises: Array<{
    type: string;
    chinese_name: string;
    sets: Array<{
      weight: number;
      reps: number;
      is_pr: boolean;
    }>;
  }>;
}

export async function createWorkout(payload: CreateWorkoutPayload): Promise<WorkoutSession> {
  const id = db.generateId();
  const previousPrs = await fetchPrRecords(payload.user_id);

  const workout: WorkoutSession & { user_id: string } = {
    id,
    user_id: payload.user_id,
    date: payload.date,
    displayDate: payload.display_date, // 注意字段名映射
    duration: payload.duration,
    exercises: payload.exercises.map(ex => {
      const tracksStrengthPr = ex.type !== 'Incline Cardio' && ex.chinese_name !== '有氧爬坡';
      const previousPr = previousPrs[ex.type] || previousPrs[ex.chinese_name] || 0;
      const maxWeightInExercise = Math.max(...ex.sets.map(s => s.weight), 0);
      const marksNewPr = tracksStrengthPr && maxWeightInExercise > previousPr;
      let prMarked = false;

      return {
        id: db.generateId(),
        type: ex.type as any, // 简化处理
        chineseName: ex.chinese_name,
        sets: ex.sets.map(s => {
          const isNewPrSet = marksNewPr && !prMarked && s.weight === maxWeightInExercise && s.weight > 0;
          if (isNewPrSet) prMarked = true;

          return {
            id: db.generateId(),
            weight: s.weight,
            reps: s.reps,
            isPR: isNewPrSet
          };
        })
      };
    })
  };

  await db.dbSaveWorkout(workout);
  return workout;
}

export async function deleteWorkout(sessionId: string): Promise<void> {
  return db.dbDeleteWorkout(sessionId);
}

export async function updateSet(setId: string, data: { weight?: number; reps?: number; is_pr?: boolean }): Promise<void> {
  return db.dbUpdateSet(setId, data);
}

export async function deleteSet(setId: string): Promise<void> {
  return db.dbDeleteSet(setId);
}

// ===== 统计 API =====

export async function fetchPrRecords(
  userId: string = DEFAULT_USER_ID
): Promise<Record<string, number>> {
  const workouts = await db.dbGetWorkouts(userId);
  const prs: Record<string, number> = {};

  // 遍历所有训练，找出每种动作的最大重量
  // 注意：这里简单取历史最大值，如果需要更复杂的逻辑（如 specifically marked as PR）可以调整
  // 现有逻辑: isPR 标记是用户手动或后端计算的。我们这里重新计算 global max

  workouts.forEach(workout => {
    workout.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        // Use type as key if available (matches UI selection), else chineseName
        const key = ex.type || ex.chineseName;
        const currentPr = prs[key] || 0;
        if (set.weight > currentPr) {
          prs[key] = set.weight;
        }
      });

    });
  });

  return prs;
}

export interface TrendPoint {
  date: string;
  weight: number;
}

export async function fetchTrends(
  exerciseType: string,
  userId: string = DEFAULT_USER_ID
): Promise<TrendPoint[]> {
  // exerciseType string might be "Bench Press" or "Deadlift"
  // But workouts store Chinese name or Type enum?
  // Frontend passes 'Bench Press'.
  // We need to match ExerciseType or chineseName?
  // Let's check how Trend is called. usually with type like 'Bench Press'.

  const workouts = await db.dbGetWorkouts(userId);
  const points: TrendPoint[] = [];

  workouts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Ascending for chart

  workouts.forEach(workout => {
    // Find best set for this exercise in this workout
    let maxWeight = 0;
    let found = false;

    workout.exercises.forEach(ex => {
      if (ex.type === exerciseType || ex.chineseName === exerciseType) { // Loose match
        ex.sets.forEach(set => {
          if (set.weight > maxWeight) maxWeight = set.weight;
        });
        found = true;
      }
    });

    if (found && maxWeight > 0) {
      points.push({
        date: workout.date.substring(5), // MM-DD
        weight: maxWeight
      });
    }
  });

  return points;
}

// ===== 照片 API =====

export async function fetchPhotos(userId: string = DEFAULT_USER_ID): Promise<UserPhoto[]> {
  return db.dbGetPhotos(userId);
}

export async function createPhoto(data: {
  user_id: string;
  url: string;
  date: string;
  label?: string;
}): Promise<UserPhoto> {
  const photo: UserPhoto & { user_id: string } = {
    id: db.generateId(),
    user_id: data.user_id,
    url: data.url,
    date: data.date,
    label: data.label || ''
  };
  return db.dbSavePhoto(photo);
}

export async function updatePhoto(
  photoId: string,
  data: Partial<{ date: string; label: string }>
): Promise<UserPhoto> {
  // 先读出所有照片找到目标照片，更新后再存回
  const allPhotos = await db.dbGetPhotos(DEFAULT_USER_ID);
  const target = allPhotos.find(p => p.id === photoId);
  if (!target) throw new Error('Photo not found');
  const updated = { ...target, ...data } as UserPhoto & { user_id: string };
  // dbSavePhoto 是 put 操作，可直接覆盖
  return db.dbSavePhoto(updated);
}

export async function deletePhoto(photoId: string): Promise<void> {
  return db.dbDeletePhoto(photoId);
}
