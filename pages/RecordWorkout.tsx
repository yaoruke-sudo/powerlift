
import React, { useState, useEffect } from 'react';
import { ExerciseType, WorkoutSession } from '../types';
import { EXERCISE_INFO } from '../constants';
import { createWorkout, DEFAULT_USER_ID } from '../services/api';

interface RecordWorkoutProps {
  initialDate?: string;
  onBack: () => void;
  onSave: (session?: WorkoutSession) => void;
}

const RecordWorkout: React.FC<RecordWorkoutProps> = ({ initialDate, onBack, onSave }) => {
  const [weight, setWeight] = useState(50);
  const [sets, setSets] = useState(4);
  const [reps, setReps] = useState(12);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  // 有氧运动专用状态
  const [duration, setDuration] = useState(30); // 时间（分钟）
  const [incline, setIncline] = useState(5); // 坡度（度）
  const [speed, setSpeed] = useState(5.0); // 速度（km/h）
  const [selectedExercise, setSelectedExercise] = useState({
    type: ExerciseType.BENCH_PRESS,
    name: '杠铃卧推',
    category: '核心'
  });
  // 自定义动作列表（持久化在 localStorage 中）
  const [customExercises, setCustomExercises] = useState<{ type: string; name: string; category: string }[]>([]);

  // 默认内置动作（与 ExerciseType 枚举同步）
  const baseExercises = [
    { type: ExerciseType.BENCH_PRESS, name: '杠铃卧推', category: '胸部' },
    { type: ExerciseType.INCLINE_DUMBBELL_PRESS, name: '哑铃上斜推举', category: '胸部' },
    { type: ExerciseType.MACHINE_CHEST_PRESS, name: '器械推胸', category: '胸部' },
    { type: ExerciseType.PULL_UP, name: '引体向上', category: '背部' },
    { type: ExerciseType.LAT_PULLDOWN, name: '高位下拉', category: '背部' },
    { type: ExerciseType.MACHINE_ROW, name: '器械划船', category: '背部' },
    { type: ExerciseType.DUMBBELL_SHOULDER_PRESS, name: '哑铃推肩', category: '肩部' },
    { type: ExerciseType.FLY, name: '飞鸟', category: '胸部' },
    { type: ExerciseType.REVERSE_FLY, name: '反向飞鸟', category: '背部' },
    { type: ExerciseType.INCLINE_CARDIO, name: '有氧爬坡', category: '有氧' },
  ];

  // 判断当前选中的运动是否为有氧类型
  const isCardio = selectedExercise.type === ExerciseType.INCLINE_CARDIO || selectedExercise.type === 'Incline Cardio';

  // 读取本地保存的自定义动作
  useEffect(() => {
    try {
      const saved = localStorage.getItem('custom_exercises');
      if (saved) {
        setCustomExercises(JSON.parse(saved));
      }
    } catch (e) {
      console.error('读取自定义动作失败:', e);
    }
  }, []);

  // 统一的可选动作列表：内置 + 自定义 + “新增自定义”入口
  const availableExercises = [
    ...baseExercises,
    ...customExercises,
    { type: 'Custom', name: '新增自定义动作', category: '其他' },
  ];

  // 保存自定义动作到 localStorage
  const persistCustomExercises = (list: { type: string; name: string; category: string }[]) => {
    setCustomExercises(list);
    try {
      localStorage.setItem('custom_exercises', JSON.stringify(list));
    } catch (e) {
      console.error('保存自定义动作失败:', e);
    }
  };

  const handleExerciseSelect = (ex: any) => {
    // 选择任意动作后，都关闭弹窗，让上方主卡片生效
    setSelectedExercise(ex);
    setIsPickerOpen(false);
  };

  /**
   * 保存训练数据到后端
   * 根据 sets/reps/weight 生成对应组数据，然后调用 API 创建
   */
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const now = new Date();
      // Use initialDate if available, otherwise use today (handling local time correctly for creation)
      // Note: initialDate is 'YYYY-MM-DD'
      const dateToUse = initialDate ? new Date(initialDate) : now;

      // If we used initialDate (which is UTC 00:00 usually when parsing YYYY-MM-DD), 
      // we need to be careful. But strictly speaking, the backend expects YYYY-MM-DD string.
      // So we can just use initialDate directly if present.

      const dateStr = initialDate || now.toISOString().split('T')[0]; // YYYY-MM-DD

      // For display date, we want to format the date we are actually using.
      // Since dateStr is YYYY-MM-DD, we can parse it to display.
      // Be careful with timezones parsing 'YYYY-MM-DD'. 
      // Best to create a date object that represents that day in local time.
      const displayDateObj = new Date(dateStr);
      // Fix timezone offset issue for display if needed, but for simple display:
      const displayDate = displayDateObj.toLocaleDateString('zh-CN', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });

      // 有氧运动与力量训练的数据结构不同
      const isCardioExercise = selectedExercise.type === ExerciseType.INCLINE_CARDIO || selectedExercise.type === 'Incline Cardio';

      let setsData;
      let workoutDuration;

      if (isCardioExercise) {
        // 有氧模式：复用 weight 存速度，reps 存时间，isPR 存坡度信息
        setsData = [{
          weight: speed,
          reps: duration,
          is_pr: false,
        }];
        workoutDuration = duration;
      } else {
        // 力量训练模式
        setsData = Array.from({ length: sets }, (_, idx) => ({
          weight,
          reps,
          is_pr: idx === sets - 1,
        }));
        workoutDuration = sets * 3;
      }

      // 如果当前是一个新自定义动作（type === 'Custom'，且用户输入了名称），先把它加入自定义动作列表
      if (selectedExercise.type === 'Custom' && selectedExercise.name && selectedExercise.name !== '新增自定义动作') {
        const newCustom = {
          type: selectedExercise.name,
          name: selectedExercise.name,
          category: selectedExercise.category || '其他',
        };
        if (!customExercises.some(ex => ex.type === newCustom.type)) {
          persistCustomExercises([...customExercises, newCustom]);
        }
      }

      // 有氧运动在备注中记录坡度信息
      const finalNote = isCardioExercise
        ? `坡度: ${incline}° | 速度: ${speed}km/h | 时长: ${duration}分钟${note ? ' | ' + note : ''}`
        : (note || undefined);

      const savedSession = await createWorkout({
        user_id: DEFAULT_USER_ID,
        date: dateStr,
        display_date: displayDate,
        duration: workoutDuration,
        note: finalNote,
        exercises: [
          {
            type: selectedExercise.type === 'Custom' ? selectedExercise.name : selectedExercise.type,
            chinese_name: selectedExercise.name,
            sets: setsData,
          },
        ],
      });

      onSave(savedSession);
    } catch (error) {
      console.error('保存训练记录失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-dark overflow-hidden">
      {/* Header */}
      <header className="px-6 py-8 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-black text-white">
            {initialDate ? '补录训练' : '今日训练'}
          </h1>
          {initialDate && (
            <p className="text-slate-500 text-sm font-bold tracking-widest uppercase mt-1">
              {initialDate}
            </p>
          )}
        </div>
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-dark text-slate-400">
          <span className="material-icons-round">close</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 py-2 space-y-10 scrollbar-hide">

        {/* Active Exercise Card */}
        <button
          onClick={() => setIsPickerOpen(true)}
          className="w-full bg-surface-dark rounded-2xl p-6 border border-white/5 relative overflow-hidden text-left hover:bg-surface-lighter transition-colors group"
        >
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-xs text-primary font-bold tracking-widest uppercase block mb-1">
                {selectedExercise.category}
              </span>
              <h2 className="text-4xl font-black text-white">
                {selectedExercise.type === 'Custom' ? (
                  <input
                    type="text"
                    value={selectedExercise.name === '自定义动作' ? '' : selectedExercise.name}
                    placeholder="输入动作名称"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setSelectedExercise({ ...selectedExercise, name: e.target.value })}
                    className="bg-transparent border-b border-white/20 w-full focus:outline-none focus:border-primary"
                    autoFocus
                  />
                ) : (
                  selectedExercise.name
                )}
              </h2>
              <div className="text-slate-500 text-xs font-bold mt-2 uppercase tracking-tight">
                {selectedExercise.type}
              </div>
            </div>
            <div className="flex flex-col items-end gap-4">
              <span className="material-icons-round text-primary/40 group-hover:text-primary group-hover:scale-110 transition-all">open_in_full</span>
              <div className="text-slate-400 text-sm font-medium">
                {isCardio ? `${duration}分 • ${incline}° • ${speed}km/h` : `${sets} 组 • 目标 ${reps} 次`}
              </div>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-5 -mr-6 -mb-6 group-hover:scale-110 transition-transform duration-500">
            <span className="material-icons-round text-[160px]">{isCardio ? 'landscape' : 'fitness_center'}</span>
          </div>
        </button>

        {/* Input Controls —— 根据运动类型切换显示 */}
        <div className="space-y-12">
          {isCardio ? (
            /* === 有氧模式：时间 / 坡度 / 速度 === */
            <>
              {/* 时间（分钟） */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black text-slate-500 tracking-[0.2em] uppercase">Duration / 时间</span>
                </div>
                <div className="bg-surface-dark rounded-2xl p-6 border border-white/5 shadow-inner">
                  <div className="flex justify-center items-baseline gap-2 mb-8">
                    <span className="text-6xl font-black text-white font-display tracking-tighter">{duration}</span>
                    <span className="text-xl font-black text-primary font-display">分钟</span>
                  </div>
                  <div className="relative h-12 ruler-container">
                    <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-primary rounded-full shadow-[0_0_10px_rgba(242,108,13,0.8)] z-20"></div>
                    <div className="flex items-end justify-between h-full px-2 opacity-30">
                      {Array.from({ length: 21 }).map((_, i) => (
                        <div key={i} className={`w-0.5 rounded-full bg-white ${i % 5 === 0 ? 'h-full' : 'h-1/2'}`}></div>
                      ))}
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="120"
                      step="1"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                    />
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-primary/20 pointer-events-none transition-all duration-75 rounded-r-lg z-20"
                      style={{ width: `${(duration / 120) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* 坡度 + 速度 并排 */}
              <div className="grid grid-cols-2 gap-6">
                {/* 坡度 */}
                <div className="bg-surface-dark rounded-2xl p-5 border border-white/5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center mb-3">Incline / 坡度</span>
                  <div className="flex justify-center items-baseline gap-1 mb-4">
                    <span className="text-3xl font-black text-white font-display">{incline}</span>
                    <span className="text-sm font-black text-primary">°</span>
                  </div>
                  <div className="relative h-8">
                    <input
                      type="range"
                      min="0"
                      max="45"
                      step="0.5"
                      value={incline}
                      onChange={(e) => setIncline(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                    />
                    <div className="absolute inset-0 rounded-lg bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-primary/30 rounded-lg transition-all duration-75"
                        style={{ width: `${(incline / 45) * 100}%` }}
                      ></div>
                    </div>
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-primary rounded-full shadow-[0_0_8px_rgba(242,108,13,0.6)] z-20"
                      style={{ left: `${(incline / 45) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* 速度 */}
                <div className="bg-surface-dark rounded-2xl p-5 border border-white/5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center mb-3">Speed / 速度</span>
                  <div className="flex justify-center items-baseline gap-1 mb-4">
                    <span className="text-3xl font-black text-white font-display">{speed}</span>
                    <span className="text-[10px] font-black text-primary">km/h</span>
                  </div>
                  <div className="relative h-8">
                    <input
                      type="range"
                      min="0.5"
                      max="15"
                      step="0.1"
                      value={speed}
                      onChange={(e) => setSpeed(Number(parseFloat(e.target.value).toFixed(1)))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                    />
                    <div className="absolute inset-0 rounded-lg bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-primary/30 rounded-lg transition-all duration-75"
                        style={{ width: `${(speed / 15) * 100}%` }}
                      ></div>
                    </div>
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-primary rounded-full shadow-[0_0_8px_rgba(242,108,13,0.6)] z-20"
                      style={{ left: `${(speed / 15) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* === 力量训练模式：重量 / 组数 / 次数 === */
            <>
              {/* Weight */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black text-slate-500 tracking-[0.2em] uppercase">Weight / 重量</span>
                </div>
                <div className="bg-surface-dark rounded-2xl p-6 border border-white/5 shadow-inner">
                  <div className="flex justify-center items-baseline gap-2 mb-8">
                    <span className="text-6xl font-black text-white font-display tracking-tighter">{weight}</span>
                    <span className="text-xl font-black text-primary font-display">KG</span>
                  </div>
                  <div className="relative h-12 ruler-container">
                    <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-primary rounded-full shadow-[0_0_10px_rgba(242,108,13,0.8)] z-20"></div>
                    <div className="flex items-end justify-between h-full px-2 opacity-30">
                      {Array.from({ length: 21 }).map((_, i) => (
                        <div key={i} className={`w-0.5 rounded-full bg-white ${i % 5 === 0 ? 'h-full' : 'h-1/2'}`}></div>
                      ))}
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      step="2.5"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                    />
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-primary/20 pointer-events-none transition-all duration-75 rounded-r-lg z-20"
                      style={{ width: `${(weight / 200) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Sets/Reps Counters */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-surface-dark rounded-2xl p-5 border border-white/5 text-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sets / 组数</span>
                  <div className="flex items-center justify-center gap-4 mt-3">
                    <button onClick={() => setSets(Math.max(1, sets - 1))} className="w-8 h-8 rounded-lg bg-surface-lighter flex items-center justify-center text-slate-400 active:bg-primary active:text-white transition-colors">
                      <span className="material-icons-round text-lg">remove</span>
                    </button>
                    <span className="text-3xl font-black text-white font-display w-8">{sets}</span>
                    <button onClick={() => setSets(sets + 1)} className="w-8 h-8 rounded-lg bg-surface-lighter flex items-center justify-center text-slate-400 active:bg-primary active:text-white transition-colors">
                      <span className="material-icons-round text-lg">add</span>
                    </button>
                  </div>
                </div>

                <div className="bg-surface-dark rounded-2xl p-5 border border-white/5 text-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reps / 次数</span>
                  <div className="flex items-center justify-center gap-4 mt-3">
                    <button onClick={() => setReps(Math.max(1, reps - 1))} className="w-8 h-8 rounded-lg bg-surface-lighter flex items-center justify-center text-slate-400 active:bg-primary active:text-white transition-colors">
                      <span className="material-icons-round text-lg">remove</span>
                    </button>
                    <span className="text-3xl font-black text-white font-display w-8">{reps}</span>
                    <button onClick={() => setReps(reps + 1)} className="w-8 h-8 rounded-lg bg-surface-lighter flex items-center justify-center text-slate-400 active:bg-primary active:text-white transition-colors">
                      <span className="material-icons-round text-lg">add</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="p-6 pb-12 bg-background-dark/80 backdrop-blur-lg space-y-4 border-t border-white/5">
        <div className="bg-surface-dark rounded-xl px-4 py-3 flex items-center gap-3 border border-white/5">
          <span className="material-icons-round text-slate-500 text-lg">edit_note</span>
          <input
            type="text"
            placeholder="写点心情或状态..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm text-slate-300 w-full placeholder:text-slate-600"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full bg-primary py-5 rounded-2xl text-white font-black text-xl flex items-center justify-center gap-3 shadow-lg shadow-primary/30 active:scale-95 transition-all ${isSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <span className="material-icons-round text-2xl">{isSaving ? 'hourglass_empty' : 'check_circle'}</span>
          {isSaving ? '保存中...' : '保存此组数据'}
        </button>
      </footer>

      {/* Exercise Picker Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 backdrop-blur-sm px-4 pb-8">
          <div className="w-full max-w-sm bg-surface-dark rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[70vh]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-black text-white">选择运动项目</h3>
              <button onClick={() => setIsPickerOpen(false)} className="material-icons-round text-slate-500">close</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
              {availableExercises.map((ex, idx) => {
                const isCustomSaved = customExercises.some(c => c.type === ex.type);
                const isNewCustomEntry = ex.type === 'Custom';

                return (
                  <div
                    key={idx}
                    className="w-full p-3 rounded-xl text-left flex items-center gap-3 transition-colors group hover:bg-white/5"
                  >
                    <button
                      onClick={() => handleExerciseSelect(ex)}
                      className="flex-1 flex items-center gap-4"
                    >
                      <div className="flex-1">
                        <div className="text-white font-bold">
                          {isNewCustomEntry ? '➕ 新增自定义动作' : ex.name}
                        </div>
                        {isNewCustomEntry && (
                          <div className="text-xs text-slate-500 uppercase">
                            点击后在上方输入名称
                          </div>
                        )}
                      </div>
                    </button>

                    {/* 已保存的自定义动作支持删除 */}
                    {isCustomSaved && (
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = customExercises.filter(c => c.type !== ex.type);
                          persistCustomExercises(filtered);
                        }}
                        className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                      >
                        <span className="material-icons-round text-sm">delete</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordWorkout;
