
import React from 'react';
import { ViewState } from '../types';

interface BottomNavProps {
  active: 'calendar' | 'workout' | 'stats' | 'profile';
  onNavigate: (view: ViewState) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ active, onNavigate }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-20 bg-background-dark/95 backdrop-blur-xl border-t border-white/5 flex justify-around items-start pt-3 safe-pb z-50">
      <button 
        onClick={() => onNavigate('calendar')} 
        className={`flex flex-col items-center gap-1 w-16 group transition-all ${active === 'calendar' ? 'text-primary scale-110' : 'text-slate-500 hover:text-slate-300'}`}
      >
        <span className="material-icons-round text-2xl">calendar_today</span>
        <span className="text-[9px] font-black uppercase tracking-widest">日历</span>
      </button>

      <button 
        onClick={() => onNavigate('summary')} 
        className={`flex flex-col items-center gap-1 w-16 group transition-all ${active === 'workout' ? 'text-primary scale-110' : 'text-slate-500 hover:text-slate-300'}`}
      >
        <span className="material-icons-round text-2xl">fitness_center</span>
        <span className="text-[9px] font-black uppercase tracking-widest">训练</span>
      </button>

      <div className="relative -top-8 px-2">
        <button 
          onClick={() => onNavigate('record')}
          className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center shadow-[0_12px_30px_rgba(242,108,13,0.5)] hover:scale-105 hover:-translate-y-1 transition-all active:scale-90 ring-4 ring-background-dark"
        >
          <span className="material-icons-round text-white text-4xl">add</span>
        </button>
      </div>

      <button 
        onClick={() => onNavigate('dashboard')} 
        className={`flex flex-col items-center gap-1 w-16 group transition-all ${active === 'stats' ? 'text-primary scale-110' : 'text-slate-500 hover:text-slate-300'}`}
      >
        <span className="material-icons-round text-2xl">bar_chart</span>
        <span className="text-[9px] font-black uppercase tracking-widest">统计</span>
      </button>

      <button 
        onClick={() => onNavigate('profile')} 
        className={`flex flex-col items-center gap-1 w-16 group transition-all ${active === 'profile' ? 'text-primary scale-110' : 'text-slate-500 hover:text-slate-300'}`}
      >
        <span className="material-icons-round text-2xl">person</span>
        <span className="text-[9px] font-black uppercase tracking-widest">我的</span>
      </button>
    </nav>
  );
};

export default BottomNav;
