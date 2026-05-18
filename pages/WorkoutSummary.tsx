
import React from 'react';
import { ExerciseType, WorkoutSession, ViewState } from '../types';
import { EXERCISE_INFO } from '../constants';
import BottomNav from '../components/BottomNav';
import { AnimatedContent, AnimatedList, CountUp, SpotlightCard, StarBorder } from '../components/reactbits';

import { updateSet, deleteWorkout, deleteSet } from '../services/api';

interface WorkoutSummaryProps {
  session?: WorkoutSession | null;
  date?: string;
  daySessions?: WorkoutSession[];
  onNavigate: (view: ViewState) => void;
  onSelectSession?: (session: WorkoutSession) => void;
  onCreateNew?: () => void;
  // 删除操作成功后通知外部刷新数据，解决删除后重进数据复原的问题
  onDataChanged?: () => void;
}

const WorkoutSummary: React.FC<WorkoutSummaryProps> = ({
  session: initialSession,
  date,
  daySessions = [],
  onNavigate,
  onSelectSession,
  onCreateNew,
  onDataChanged
}) => {
  // Use state to allow local updates after editing
  const [session, setSession] = React.useState(initialSession);

  // 本地维护一份可编辑的 daySessions，避免每次都整页刷新
  const [localDaySessions, setLocalDaySessions] = React.useState<WorkoutSession[]>(daySessions);

  // Update local state if prop changes
  React.useEffect(() => {
    setSession(initialSession);
  }, [initialSession]);


  // 外部传入的 daySessions 变化时，同步到本地副本
  React.useEffect(() => {
    setLocalDaySessions(daySessions);
  }, [daySessions]);

  // 将当天所有 session 的动作拍平成一个列表用于展示
  const allExercises = React.useMemo(() => {
    return localDaySessions.flatMap(s => s.exercises);
  }, [localDaySessions]);
  const totalSets = React.useMemo(
    () => allExercises.reduce((sum, ex) => sum + ex.sets.length, 0),
    [allExercises]
  );
  const totalLoad = React.useMemo(
    () => allExercises.reduce((sum, ex) => (
      sum + ex.sets.reduce((setSum, set) => setSum + set.weight * set.reps, 0)
    ), 0),
    [allExercises]
  );

  const [editingSet, setEditingSet] = React.useState<any>(null);
  const [editWeight, setEditWeight] = React.useState(0);
  const [editReps, setEditReps] = React.useState(0);
  const editingExercise = React.useMemo(
    () => allExercises.find(ex => ex.sets.some(set => set.id === editingSet?.id)),
    [allExercises, editingSet]
  );
  const isEditingCardio = editingExercise?.type === ExerciseType.INCLINE_CARDIO || editingExercise?.type === 'Incline Cardio';

  // 删除当天所有训练记录
  const handleDeleteDayWorkouts = async () => {
    if (!date || localDaySessions.length === 0) return;
    const ok = window.confirm(`确定要删除 ${date} 的全部训练记录吗？此操作不可恢复。`);
    if (!ok) return;

    try {
      await Promise.all(localDaySessions.map(s => deleteWorkout(s.id)));
      setLocalDaySessions([]);
      // 通知外层刷新 workoutHistory，确保数据持久化生效
      onDataChanged?.();
      onNavigate('calendar');
    } catch (err) {
      console.error('删除训练记录失败:', err);
      alert('删除失败，请重试');
    }
  };

  const handleEditClick = (set: any) => {
    setEditingSet(set);
    setEditWeight(set.weight);
    setEditReps(set.reps);
  };

  const handleSaveEdit = async () => {
    if (!editingSet) return;
    try {
      await updateSet(editingSet.id, {
        weight: editWeight,
        reps: editReps
      });

      // 本地同步更新当前页面展示的数据，避免整页刷新导致“重进且看起来没保存”
      setLocalDaySessions(prev =>
        prev.map(s => ({
          ...s,
          exercises: s.exercises.map(ex => ({
            ...ex,
            sets: ex.sets.map(setItem =>
              setItem.id === editingSet.id
                ? { ...setItem, weight: editWeight, reps: editReps }
                : setItem
            ),
          })),
        }))
      );

      setEditingSet(null);
    } catch (err) {
      console.error('Failed to update set', err);
      alert('更新失败');
    }
  };

  // 删除单条组数据
  const handleDeleteSet = async (setId: string) => {
    const ok = window.confirm('确定要删除这条训练数据吗？');
    if (!ok) return;

    try {
      await deleteSet(setId);

      // 本地同步删除
      setLocalDaySessions(prev =>
        prev
          .map(s => ({
            ...s,
            exercises: s.exercises
              .map(ex => ({
                ...ex,
                sets: ex.sets.filter(setItem => setItem.id !== setId),
              }))
              .filter(ex => ex.sets.length > 0),
          }))
          .filter(s => s.exercises.length > 0)
      );
      // 通知外层刷新 workoutHistory
      onDataChanged?.();
    } catch (err) {
      console.error('删除单条训练数据失败:', err);
      alert('删除失败，请重试');
    }
  };

  // --- DETAILS VIEW (Merged) ---
  return (
    <div className="flex flex-col h-full screen-surface overflow-hidden">
      <header className="px-5 pt-5 pb-3 shrink-0">
        <AnimatedContent distance={14} duration={360}>
          <section className="cockpit-panel debrief-hero rounded-[1.75rem] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onNavigate('calendar')}
                    className="control-button focus-ring flex h-8 w-8 items-center justify-center rounded-xl text-slate-300"
                  >
                    <span className="material-icons-round text-sm">arrow_back</span>
                  </button>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{date}</div>
                </div>
                <h1 className="holo-title mt-3 text-4xl font-black tracking-tight text-white">今日训练</h1>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Session Debrief
                </p>
              </div>

              {localDaySessions.length > 0 && (
                <button
                  onClick={handleDeleteDayWorkouts}
                  className="danger-soft pressable flex items-center gap-1 rounded-xl px-2.5 py-2 text-[11px] font-bold text-red-400 hover:bg-red-500/20"
                >
                  <span className="material-icons-round text-xs">delete_forever</span>
                  删除
                </button>
              )}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: '动作', value: allExercises.length },
                { label: '组数', value: totalSets },
                { label: '负荷', value: Math.round(totalLoad) },
              ].map(item => (
                <div key={item.label} className="hud-chip metric-tile hero-metric px-2.5 py-2">
                  <div className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-500">{item.label}</div>
                  <div className="mt-1 text-sm font-black text-white font-display">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="hero-telemetry" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </section>
        </AnimatedContent>
      </header>


      <main className="flex-1 overflow-y-auto scrollbar-hide px-6 py-2 space-y-6 pb-28">
        {/* Exercises List - Merged from all sessions */}
        {allExercises.length > 0 ? (
          <AnimatedList className="space-y-6" staggerDelay={55} distance={18}>
            {allExercises.map((ex, index) => {
            const isCardioExercise = ex.type === ExerciseType.INCLINE_CARDIO || ex.type === 'Incline Cardio';
            const primaryUnit = isCardioExercise ? 'km/h' : 'KG';
            const secondaryUnit = isCardioExercise ? 'MIN' : 'REPS';

            return (
              <SpotlightCard key={`${ex.id}-${index}`} className="chrome-card session-card rounded-3xl overflow-hidden">
                <div className="p-5 flex justify-between items-start border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-primary border border-white/5">
                      <span className="material-icons-round text-3xl">
                        {EXERCISE_INFO[ex.type]?.icon || 'fitness_center'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">{ex.chineseName}</h3>
                      <div className="text-xs text-slate-500 tracking-wider uppercase font-medium">{ex.type}</div>
                    </div>
                  </div>
                  <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-black ring-1 ring-primary/20">
                    {ex.sets.length} 组
                  </div>
                </div>

                <AnimatedList className="p-6 space-y-5" staggerDelay={34} distance={10}>
                  {ex.sets.map((set, idx) => (
                    <div
                      key={set.id}
                      className={`session-row flex justify-between items-center text-sm py-1.5 relative ${set.isPR ? 'bg-primary/5 -mx-6 px-6 border-l-4 border-primary' : ''}`}
                    >
                      <span className={`w-8 font-black font-display text-xs ${set.isPR ? 'text-primary' : 'text-slate-600'}`}>{idx + 1}</span>
                      <div className="flex-1 pl-4 flex items-baseline gap-1.5">
                        <CountUp to={set.weight} duration={0.45} className="text-white font-black font-display text-2xl tracking-tighter" />
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{primaryUnit}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-baseline gap-1">
                          <CountUp to={set.reps} duration={0.45} className={`font-black font-display text-2xl tracking-tighter ${set.isPR ? 'text-white' : 'text-slate-300'}`} />
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{secondaryUnit}</span>
                        </div>
                        {set.isPR && (
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="material-icons-round text-primary text-sm">emoji_events</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 ml-2">
                          <button
                            onClick={() => handleEditClick(set)}
                            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                          >
                            <span className="material-icons-round text-slate-400 text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteSet(set.id)}
                            className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center hover:bg-red-500/30 transition-colors"
                          >
                            <span className="material-icons-round text-red-400 text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </AnimatedList>
              </SpotlightCard>
            );
            })}
          </AnimatedList>
        ) : (
          <div className="empty-state-beacon text-center py-12 text-slate-500 text-sm">
            <span className="material-icons-round text-4xl mb-2 opacity-50">fitness_center</span>
            <p>本日暂无训练记录</p>
          </div>
        )}

        <div className="py-4">
          <StarBorder
            as="button"
            onClick={onCreateNew}
            className="pressable w-full rounded-[22px]"
            contentClassName="action-primary w-full rounded-[21px] py-4 text-white font-black gap-2 transition-colors"
            color="#d8fbff"
            speed="4.5s"
            thickness={1.5}
          >
            <span className="material-icons-round">add_circle</span>
            添加新训练
          </StarBorder>
        </div>
      </main>

      {/* Edit Set Modal */}
      {editingSet && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="glass-sheet w-full max-w-xs rounded-3xl overflow-hidden border p-6 space-y-6">
            <h3 className="text-xl font-black text-white text-center">修改数据</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                  {isEditingCardio ? 'Speed (km/h)' : 'Weight (KG)'}
                </label>
                <input
                  type="number"
                  value={editWeight}
                  onChange={(e) => setEditWeight(Number(e.target.value))}
                  className="w-full bg-background-dark/80 rounded-xl border border-white/10 p-4 text-2xl font-black text-white text-center focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                  {isEditingCardio ? 'Duration (min)' : 'Reps'}
                </label>
                <div className="flex items-center gap-4">
                  <button onClick={() => setEditReps(Math.max(1, editReps - 1))} className="control-button w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:bg-white/5">
                    <span className="material-icons-round">remove</span>
                  </button>
                  <div className="flex-1 bg-background-dark/80 rounded-xl border border-white/10 p-2 text-2xl font-black text-white text-center flex items-center justify-center h-12">
                    {editReps}
                  </div>
                  <button onClick={() => setEditReps(editReps + 1)} className="control-button w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:bg-white/5">
                    <span className="material-icons-round">add</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditingSet(null)}
                className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 font-bold text-sm hover:bg-white/10"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark shadow-lg shadow-primary/20"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="workout" onNavigate={onNavigate} />
    </div>
  );
};

export default WorkoutSummary;
