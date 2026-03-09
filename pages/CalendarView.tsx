
import React, { useState } from 'react';
import { ViewState, WorkoutSession } from '../types';
import BottomNav from '../components/BottomNav';

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
    <div className="flex flex-col h-full bg-background-dark overflow-hidden">
      <header className="px-8 pt-12 pb-6">
        <h1 className="text-4xl font-black text-white mb-2">训练日历</h1>
        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">History & Planning</p>
      </header>

      <main className="flex-1 overflow-y-auto px-6 space-y-8 scrollbar-hide pb-32">
        {/* Month Selector */}
        <div className="flex items-center justify-between bg-surface-dark rounded-2xl p-4 border border-white/5">
          <button onClick={prevMonth} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 active:bg-white/10 transition-colors text-slate-400">
            <span className="material-icons-round">chevron_left</span>
          </button>
          <span className="text-lg font-black text-white">
            {year}年 {month + 1}月
          </span>
          <button onClick={nextMonth} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 active:bg-white/10 transition-colors text-slate-400">
            <span className="material-icons-round">chevron_right</span>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-surface-dark rounded-3xl p-6 border border-white/5 shadow-xl">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['日', '一', '二', '三', '四', '五', '六'].map(d => (
              <div key={d} className="text-center text-[10px] font-black text-slate-600 uppercase">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-4 gap-x-2">
            {days.map((d, i) => {
              const hasWorkout = d.date && workoutDates.includes(d.date);
              const isToday = d.date === new Date().toISOString().split('T')[0];

              return (
                <div key={i} className="flex flex-col items-center">
                  {d.day ? (
                    <button
                      onClick={() => d.date && onSelectDate(d.date)}
                      className={`relative w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-all ${hasWorkout
                        ? 'bg-primary/20 text-primary border border-primary/30 active:scale-90 shadow-[0_0_10px_rgba(242,108,12,0.1)]'
                        : 'text-slate-300 hover:bg-white/5 active:scale-90'
                        } ${isToday ? 'ring-2 ring-white/20' : ''}`}
                    >
                      {d.day}
                      {hasWorkout && (
                        <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_4px_rgba(242,108,12,1)]"></div>
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
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(242,108,13,0.8)]"></div>
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
