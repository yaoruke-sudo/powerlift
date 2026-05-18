
import React, { useState, useEffect } from 'react';
import { ExerciseType, WorkoutSession } from '../types';
import { EXERCISE_INFO } from '../constants';
import { AnimatedContent, AnimatedList, CountUp, GlareHover, SpotlightCard, StarBorder } from '../components/reactbits';
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
  const [statusMessage, setStatusMessage] = useState('');
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

  const weightPresets = [40, 50, 60, 70, 80, 100, 120];
  const repPresets = [5, 8, 10, 12, 15];
  const setPresets = [3, 4, 5];

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

  const normalizedExerciseName = selectedExercise.name.trim();
  const isCustomExercise = selectedExercise.type === 'Custom';
  const canSave = !isSaving && (!isCustomExercise || normalizedExerciseName.length > 0);
  const sessionSummary = isCardio
    ? `${duration} 分钟 · ${incline}° · ${speed} km/h`
    : `${sets} 组 · ${reps} 次`;

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
    if (ex.type === 'Custom') {
      setSelectedExercise({ type: 'Custom', name: '', category: '自定义' });
    } else {
      setSelectedExercise(ex);
    }
    setStatusMessage('');
    setIsPickerOpen(false);
  };

  /**
   * 保存训练数据到后端
   * 根据 sets/reps/weight 生成对应组数据，然后调用 API 创建
   */
  const handleSave = async () => {
    if (!canSave) {
      setStatusMessage('先给自定义动作起个名字，再保存训练。');
      return;
    }

    setIsSaving(true);
    setStatusMessage('');
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
          is_pr: false,
        }));
        workoutDuration = sets * 3;
      }

      // 如果当前是一个新自定义动作（type === 'Custom'，且用户输入了名称），先把它加入自定义动作列表
      if (selectedExercise.type === 'Custom' && selectedExercise.name && selectedExercise.name !== '新增自定义动作') {
        const newCustom = {
          type: normalizedExerciseName,
          name: normalizedExerciseName,
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
            type: selectedExercise.type === 'Custom' ? normalizedExerciseName : selectedExercise.type,
            chinese_name: selectedExercise.type === 'Custom' ? normalizedExerciseName : selectedExercise.name,
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
    <div className="flex flex-col h-full screen-surface overflow-hidden">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 shrink-0">
        <AnimatedContent distance={16} duration={380}>
          <div className="cockpit-panel rounded-[2rem] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="signal-chip rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em]">
                  <span className="signal-dot" />
                  Set Builder
                </div>
                <h1 className="mt-4 text-3xl font-black leading-none text-white">
                  {initialDate ? '补录训练' : '今日训练'}
                </h1>
                {initialDate && (
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    {initialDate}
                  </p>
                )}
              </div>
              <button onClick={onBack} className="control-button focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-slate-300">
                <span className="material-icons-round">close</span>
              </button>
            </div>
            <div className="mt-5 flex gap-2">
              <span className="hud-chip rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
                {isCardio ? 'Cardio' : 'Power'}
              </span>
              <span className="hud-chip rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                {isCardio ? `${duration} MIN` : `${sets} x ${reps}`}
              </span>
              <span className="hud-chip rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-accent-cyan">
                {isCardio ? `${speed} KM/H` : `${weight} KG`}
              </span>
            </div>
          </div>
        </AnimatedContent>
      </header>

      {statusMessage && (
        <div className="toast-enter mx-6 mb-3 flex items-center gap-2 rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm font-bold text-primary">
          <span className="material-icons-round text-base">info</span>
          {statusMessage}
        </div>
      )}

      {/* Main Content */}
      <main className="control-deck flex-1 overflow-y-auto px-6 py-2 pb-36 space-y-10 scrollbar-hide">

        {/* Active Exercise Card */}
        <GlareHover
          className="command-card command-console w-full rounded-[28px] shadow-[0_18px_36px_rgba(0,0,0,0.22)]"
          borderRadius="28px"
          background="transparent"
          borderColor="transparent"
          glareOpacity={0.14}
        >
          <button
            onClick={() => setIsPickerOpen(true)}
            className="interactive-surface pressable-soft w-full rounded-[28px] p-6 relative overflow-hidden text-left hover:bg-surface-lighter/60 group"
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
                    value={selectedExercise.name}
                    placeholder="输入动作名称"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      setSelectedExercise({ ...selectedExercise, name: e.target.value });
                      setStatusMessage('');
                    }}
                    className="bg-transparent border-b border-white/20 w-full focus:outline-none focus:border-primary"
                    autoFocus
                  />
                ) : (
                  selectedExercise.name
                )}
              </h2>
              <div className="text-slate-500 text-xs font-bold mt-2 uppercase tracking-tight">
                {sessionSummary}
              </div>
            </div>
            <div className="flex flex-col items-end gap-4">
              <span className="material-icons-round text-primary/40 group-hover:text-primary group-hover:scale-110 transition-all">open_in_full</span>
              <div className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-black text-slate-300 ring-1 ring-white/5">
                {isCardio ? '有氧' : '力量'}
              </div>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-5 -mr-6 -mb-6 group-hover:scale-110 transition-transform duration-500">
            <span className="material-icons-round text-[160px]">{isCardio ? 'landscape' : 'fitness_center'}</span>
          </div>
          </button>
        </GlareHover>

        {/* Input Controls —— 根据运动类型切换显示 */}
        <div className="space-y-12">
          {isCardio ? (
            /* === 有氧模式：时间 / 坡度 / 速度 === */
            <>
              {/* 时间（分钟） */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black text-slate-500 tracking-[0.2em] uppercase">Duration / 时间</span>
                  <span className="text-[10px] font-black text-slate-600 tracking-widest">1-120 MIN</span>
                </div>
                <div className="chrome-card rounded-[28px] p-6">
                  <div className="mb-8 flex items-center justify-between gap-4">
                    <button
                      onClick={() => setDuration(Math.max(1, duration - 5))}
                      className="pressable focus-ring control-button h-12 w-12 rounded-2xl text-slate-300"
                    >
                      <span className="material-icons-round">remove</span>
                    </button>
                    <div
                      className="readout-ring"
                      style={{ '--arc': `${(duration / 120) * 360}deg` } as React.CSSProperties}
                    >
                      <div className="readout-core">
                        <div className="flex items-baseline justify-center gap-2">
                          <CountUp
                            to={duration}
                            duration={0.45}
                            className="text-5xl font-black text-white font-display tracking-tighter"
                          />
                          <span className="text-base font-black text-primary font-display">分钟</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setDuration(Math.min(120, duration + 5))}
                      className="pressable focus-ring control-button h-12 w-12 rounded-2xl text-slate-300"
                    >
                      <span className="material-icons-round">add</span>
                    </button>
                  </div>
                  <div className="relative h-12 ruler-container ruler-meter rounded-2xl overflow-hidden">
                    <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-primary rounded-full shadow-[0_0_10px_rgba(255,122,26,0.8)] z-20"></div>
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
                  <div className="mt-5 flex gap-2 overflow-x-auto scrollbar-hide">
                    {[20, 30, 40, 45, 60].map(preset => (
                      <button
                        key={preset}
                        onClick={() => setDuration(preset)}
                        className={`pressable shrink-0 rounded-xl px-3 py-2 text-xs font-black ring-1 ${duration === preset ? 'bg-primary text-white ring-primary' : 'bg-white/5 text-slate-400 ring-white/5'}`}
                      >
                        {preset}分
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 坡度 + 速度 并排 */}
              <div className="grid grid-cols-2 gap-6">
                {/* 坡度 */}
                <div className="chrome-card rounded-2xl p-5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center mb-3">Incline / 坡度</span>
                  <div className="flex justify-center items-baseline gap-1 mb-4">
                    <CountUp to={incline} duration={0.35} className="text-3xl font-black text-white font-display" />
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
                    <div className="absolute inset-0 rounded-lg ruler-meter overflow-hidden">
                      <div
                        className="h-full bg-primary/30 rounded-lg transition-all duration-75"
                        style={{ width: `${(incline / 45) * 100}%` }}
                      ></div>
                    </div>
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-primary rounded-full shadow-[0_0_8px_rgba(255,122,26,0.6)] z-20"
                      style={{ left: `${(incline / 45) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* 速度 */}
                <div className="chrome-card rounded-2xl p-5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center mb-3">Speed / 速度</span>
                  <div className="flex justify-center items-baseline gap-1 mb-4">
                    <CountUp to={speed} duration={0.35} className="text-3xl font-black text-white font-display" />
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
                    <div className="absolute inset-0 rounded-lg ruler-meter overflow-hidden">
                      <div
                        className="h-full bg-primary/30 rounded-lg transition-all duration-75"
                        style={{ width: `${(speed / 15) * 100}%` }}
                      ></div>
                    </div>
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-primary rounded-full shadow-[0_0_8px_rgba(255,122,26,0.6)] z-20"
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
                  <span className="text-[10px] font-black text-slate-600 tracking-widest">STEP 2.5 KG</span>
                </div>
                <div className="chrome-card rounded-[28px] p-6">
                  <div className="mb-8 flex items-center justify-between gap-4">
                    <button
                      onClick={() => setWeight(Math.max(0, weight - 2.5))}
                      className="pressable focus-ring control-button h-12 w-12 rounded-2xl text-slate-300"
                    >
                      <span className="material-icons-round">remove</span>
                    </button>
                    <div
                      className="readout-ring"
                      style={{ '--arc': `${(weight / 200) * 360}deg` } as React.CSSProperties}
                    >
                      <div className="readout-core">
                        <div className="flex items-baseline justify-center gap-2">
                          <CountUp
                            to={weight}
                            duration={0.45}
                            className="text-5xl font-black text-white font-display tracking-tighter"
                          />
                          <span className="text-base font-black text-primary font-display">KG</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setWeight(Math.min(200, weight + 2.5))}
                      className="pressable focus-ring control-button h-12 w-12 rounded-2xl text-slate-300"
                    >
                      <span className="material-icons-round">add</span>
                    </button>
                  </div>
                  <div className="relative h-12 ruler-container ruler-meter rounded-2xl overflow-hidden">
                    <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-primary rounded-full shadow-[0_0_10px_rgba(255,122,26,0.8)] z-20"></div>
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
                  <div className="mt-5 flex gap-2 overflow-x-auto scrollbar-hide">
                    {weightPresets.map(preset => (
                      <button
                        key={preset}
                        onClick={() => setWeight(preset)}
                        className={`pressable shrink-0 rounded-xl px-3 py-2 text-xs font-black ring-1 ${weight === preset ? 'bg-primary text-white ring-primary' : 'bg-white/5 text-slate-400 ring-white/5'}`}
                      >
                        {preset}KG
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sets/Reps Counters */}
              <div className="grid grid-cols-2 gap-6">
                <SpotlightCard className="chrome-card rounded-[24px] p-5 text-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sets / 组数</span>
                  <div className="flex items-center justify-center gap-4 mt-3">
                    <button onClick={() => setSets(Math.max(1, sets - 1))} className="pressable focus-ring w-10 h-10 rounded-xl bg-surface-lighter flex items-center justify-center text-slate-400 active:bg-primary active:text-white transition-colors">
                      <span className="material-icons-round text-lg">remove</span>
                    </button>
                    <CountUp to={sets} duration={0.35} className="text-3xl font-black text-white font-display w-8" />
                    <button onClick={() => setSets(sets + 1)} className="pressable focus-ring w-10 h-10 rounded-xl bg-surface-lighter flex items-center justify-center text-slate-400 active:bg-primary active:text-white transition-colors">
                      <span className="material-icons-round text-lg">add</span>
                    </button>
                  </div>
                  <div className="mt-4 flex justify-center gap-1.5">
                    {setPresets.map(preset => (
                      <button
                        key={preset}
                        onClick={() => setSets(preset)}
                        className={`pressable h-7 min-w-7 rounded-lg text-[10px] font-black ${sets === preset ? 'bg-primary text-white' : 'bg-white/5 text-slate-500'}`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </SpotlightCard>

                <SpotlightCard className="chrome-card rounded-[24px] p-5 text-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reps / 次数</span>
                  <div className="flex items-center justify-center gap-4 mt-3">
                    <button onClick={() => setReps(Math.max(1, reps - 1))} className="pressable focus-ring w-10 h-10 rounded-xl bg-surface-lighter flex items-center justify-center text-slate-400 active:bg-primary active:text-white transition-colors">
                      <span className="material-icons-round text-lg">remove</span>
                    </button>
                    <CountUp to={reps} duration={0.35} className="text-3xl font-black text-white font-display w-8" />
                    <button onClick={() => setReps(reps + 1)} className="pressable focus-ring w-10 h-10 rounded-xl bg-surface-lighter flex items-center justify-center text-slate-400 active:bg-primary active:text-white transition-colors">
                      <span className="material-icons-round text-lg">add</span>
                    </button>
                  </div>
                  <div className="mt-4 flex justify-center gap-1.5">
                    {repPresets.map(preset => (
                      <button
                        key={preset}
                        onClick={() => setReps(preset)}
                        className={`pressable h-7 min-w-7 rounded-lg text-[10px] font-black ${reps === preset ? 'bg-primary text-white' : 'bg-white/5 text-slate-500'}`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </SpotlightCard>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="floating-save-bar p-4 pb-7 backdrop-blur-md space-y-3 border-t border-white/5">
        <div className="chrome-card rounded-xl px-4 py-2.5 flex items-center gap-3">
          <span className="material-icons-round text-slate-500 text-lg">edit_note</span>
          <input
            type="text"
            placeholder="写点心情或状态..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm text-slate-300 w-full placeholder:text-slate-600"
          />
        </div>
        <StarBorder
          as="button"
          onClick={handleSave}
          disabled={!canSave}
          className={`pressable w-full rounded-[22px] transition-all ${!canSave ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
          contentClassName="w-full rounded-[21px] bg-primary py-4 text-white font-black text-lg gap-3 shadow-lg shadow-primary/25"
          color="#fff"
          speed="4s"
          thickness={1.5}
        >
          <span className="material-icons-round text-2xl">{isSaving ? 'hourglass_empty' : 'check_circle'}</span>
          {isSaving ? '保存中...' : isCustomExercise && !normalizedExerciseName ? '先填写动作名称' : '保存此组数据'}
        </StarBorder>
      </footer>

      {/* Exercise Picker Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 backdrop-blur-sm px-4 pb-8 fade-enter">
          <div className="sheet-enter glass-sheet w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border flex flex-col max-h-[70vh]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-black text-white">选择运动项目</h3>
              <button onClick={() => setIsPickerOpen(false)} className="material-icons-round text-slate-500">close</button>
            </div>
            <AnimatedList className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide" staggerDelay={26} distance={10}>
              {availableExercises.map((ex, idx) => {
                const isCustomSaved = customExercises.some(c => c.type === ex.type);
                const isNewCustomEntry = ex.type === 'Custom';
                const isActive = selectedExercise.type === ex.type || selectedExercise.name === ex.name;

                return (
                  <div
                    key={idx}
                    className={`w-full p-3 rounded-2xl text-left flex items-center gap-3 transition-colors group ${isActive ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-white/5'}`}
                  >
                    <button
                      onClick={() => handleExerciseSelect(ex)}
                      className="flex-1 flex items-center gap-4"
                    >
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isNewCustomEntry ? 'bg-primary/15 text-primary' : 'bg-white/5 text-slate-400'}`}>
                        <span className="material-icons-round text-lg">{isNewCustomEntry ? 'add' : EXERCISE_INFO[ex.type as ExerciseType]?.icon || 'fitness_center'}</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-bold">
                          {isNewCustomEntry ? '新增自定义动作' : ex.name}
                        </div>
                        {isNewCustomEntry && (
                          <div className="text-xs text-slate-500 uppercase">
                            选择后在上方输入名称
                          </div>
                        )}
                        {!isNewCustomEntry && (
                          <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">{ex.category}</div>
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
            </AnimatedList>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordWorkout;
