
import React, { useState } from 'react';
import { ViewState, WorkoutSession } from '../types';
import BottomNav from '../components/BottomNav';
import { AnimatedContent, CountUp, SpotlightCard } from '../components/reactbits';

interface CalendarViewProps {
  history: WorkoutSession[];
  onSelectDate: (date: string) => void;
  onNavigate: (view: ViewState) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ history, onSelectDate, onNavigate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());



  const workoutDates = history.map(h => h.date);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const todayStr = new Date().toISOString().split('T')[0];
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthWorkoutCount = new Set(workoutDates.filter(date => date.startsWith(monthPrefix))).size;

  // Calendar generator
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday

  // Generate calendar grid (42 days to cover almost all month layouts)
  const days = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDayOfWeek + 1;
    if (day > 0 && day <= daysInMonth) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { day, date: dateStr, isCurrentMonth: true };
    }
    return { day: null, date: null, isCurrentMonth: false };
  });

  return (
    <div className="flex flex-col h-full screen-surface overflow-hidden">
      <header className="px-5 pt-6 pb-4">
        <AnimatedContent distance={16} duration={380}>
          <section className="cockpit-panel rounded-[2rem] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="signal-chip rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em]">
                  <span className="signal-dot" />
                  Calendar Sync
                </div>
                <h1 className="mt-4 text-4xl font-black leading-none text-white">训练日历</h1>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  History & Planning
                </p>
              </div>
              <div className="reactor-badge shrink-0">
                <span className="material-icons-round text-4xl text-accent-cyan">calendar_month</span>
              </div>
            </div>
          </section>
        </AnimatedContent>
      </header>

      <main className="flex-1 overflow-y-auto px-6 space-y-8 scrollbar-hide pb-32">
        <div className="grid grid-cols-2 gap-3">
          <SpotlightCard className="chrome-card rounded-2xl p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">本月训练</div>
            <div className="mt-2 flex items-baseline gap-1">
              <CountUp to={monthWorkoutCount} duration={0.55} className="text-3xl font-black text-white font-display" />
              <span className="text-xs font-black text-primary">天</span>
            </div>
          </SpotlightCard>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="pressable focus-ring command-card rounded-2xl p-4 text-left text-primary"
          >
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">快速定位</div>
            <div className="mt-2 flex items-center gap-2 text-sm font-black">
              <span className="material-icons-round text-lg">today</span>
              回到今天
            </div>
          </button>
        </div>

        {/* Month Selector */}
        <div className="chrome-card flex items-center justify-between rounded-2xl p-4">
          <button onClick={prevMonth} className="control-button w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 active:bg-white/10 transition-colors text-slate-400">
            <span className="material-icons-round">chevron_left</span>
          </button>
          <span className="text-lg font-black text-white">
            {year}年 {month + 1}月
          </span>
          <button onClick={nextMonth} className="control-button w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 active:bg-white/10 transition-colors text-slate-400">
            <span className="material-icons-round">chevron_right</span>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="chrome-card calendar-panel rounded-3xl p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['日', '一', '二', '三', '四', '五', '六'].map(d => (
              <div key={d} className="text-center text-[10px] font-black text-slate-600 uppercase">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-4 gap-x-2">
            {days.map((d, i) => {
              const hasWorkout = d.date && workoutDates.includes(d.date);
              const isToday = d.date === todayStr;

              return (
                <div key={i} className="flex flex-col items-center">
                  {d.day ? (
                    <button
                      onClick={() => d.date && onSelectDate(d.date)}
                      className={`relative w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-all ${hasWorkout
                        ? 'calendar-day-active text-primary active:scale-90'
                        : 'calendar-day text-slate-300 hover:bg-white/5 active:scale-90'
                        } ${isToday ? 'ring-2 ring-white/20' : ''}`}
                    >
                      {d.day}
                      {hasWorkout && (
                        <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_4px_rgba(255,122,26,1)]"></div>
                      )}
                    </button>
                  ) : (
                    <div className="w-10 h-10"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 px-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(255,122,26,0.8)]"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">有训练记录</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">无记录 (点击添加)</span>
          </div>
        </div>
      </main>


      <BottomNav active="calendar" onNavigate={onNavigate} />
    </div>
  );
};

export default CalendarView;
