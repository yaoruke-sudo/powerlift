
import { ExerciseType } from './types';

export const EXERCISE_INFO: Record<string, { name: string, icon: string }> = {
  [ExerciseType.BENCH_PRESS]: { name: '杠铃卧推', icon: 'fitness_center' },
  [ExerciseType.INCLINE_DUMBBELL_PRESS]: { name: '哑铃上斜推举', icon: 'north_east' },
  [ExerciseType.MACHINE_CHEST_PRESS]: { name: '器械推胸', icon: 'precision_manufacturing' },
  [ExerciseType.PULL_UP]: { name: '引体向上', icon: 'vertical_align_top' },
  [ExerciseType.LAT_PULLDOWN]: { name: '高位下拉', icon: 'expand_more' },
  [ExerciseType.MACHINE_ROW]: { name: '器械划船', icon: 'rowing' },
  [ExerciseType.DUMBBELL_SHOULDER_PRESS]: { name: '哑铃推肩', icon: 'publish' },
  [ExerciseType.FLY]: { name: '飞鸟', icon: 'open_with' },
  [ExerciseType.REVERSE_FLY]: { name: '反向飞鸟', icon: 'compress' },
  [ExerciseType.INCLINE_CARDIO]: { name: '有氧爬坡', icon: 'landscape' },
};

export const MOCK_TRENDS_BY_EXERCISE: Record<string, any[]> = {
  [ExerciseType.BENCH_PRESS]: [
    { date: '11/01', weight: 80 }, { date: '11/15', weight: 85 }, { date: '12/01', weight: 90 }, { date: '12/15', weight: 100 }
  ],
  [ExerciseType.LAT_PULLDOWN]: [
    { date: '11/01', weight: 40 }, { date: '11/15', weight: 45 }, { date: '12/01', weight: 50 }, { date: '12/15', weight: 55 }
  ],
};

export const PR_RECORDS: Record<string, number> = {
  [ExerciseType.BENCH_PRESS]: 100,
  [ExerciseType.LAT_PULLDOWN]: 55,
};
