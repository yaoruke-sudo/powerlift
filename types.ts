
export enum ExerciseType {
  BENCH_PRESS = 'Bench Press',
  INCLINE_DUMBBELL_PRESS = 'Incline Dumbbell Press',
  MACHINE_CHEST_PRESS = 'Machine Chest Press',
  PULL_UP = 'Pull Up',
  LAT_PULLDOWN = 'Lat Pulldown',
  MACHINE_ROW = 'Machine Row',
  DUMBBELL_SHOULDER_PRESS = 'Dumbbell Shoulder Press',
  FLY = 'Fly',
  REVERSE_FLY = 'Reverse Fly',
  INCLINE_CARDIO = 'Incline Cardio'
}

export interface SetData {
  id: string;
  weight: number;
  reps: number;
  isPR?: boolean;
}

export interface ExerciseEntry {
  id: string;
  type: ExerciseType;
  chineseName: string;
  sets: SetData[];
}

export interface WorkoutSession {
  id: string;
  date: string; // YYYY-MM-DD
  displayDate: string; // Thursday, Oct 24
  duration: number; // in minutes
  exercises: ExerciseEntry[];
}

export interface UserStats {
  height: number;
  weight: number;
  bmi: number;
}

export interface UserPhoto {
  id: string;
  url: string;
  date: string;
  label: string;
}


export type ViewState = 'splash' | 'dashboard' | 'record' | 'summary' | 'profile' | 'calendar' | 'privacy';

export interface UserProfile {
  id: string;
  name: string;
  height: number;
  weight: number;
  bmi: number;
  avatar_url: string | null;
  training_start_date: string | null;
}
