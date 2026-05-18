import React from 'react';
import { ViewState } from '../types';
import { StarBorder } from './reactbits';

interface BottomNavProps {
  active: 'calendar' | 'workout' | 'stats' | 'profile';
  onNavigate: (view: ViewState) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ active, onNavigate }) => {
  const items: Array<{
    key: BottomNavProps['active'];
    label: string;
    icon: string;
    view: ViewState;
  }> = [
    { key: 'calendar', label: '日历', icon: 'calendar_today', view: 'calendar' },
    { key: 'workout', label: '训练', icon: 'fitness_center', view: 'summary' },
    { key: 'stats', label: '统计', icon: 'bar_chart', view: 'dashboard' },
    { key: 'profile', label: '我的', icon: 'person', view: 'profile' },
  ];

  const renderItem = (item: (typeof items)[number]) => {
    const isActive = active === item.key;

    return (
      <button
        key={item.key}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
        onClick={() => onNavigate(item.view)}
        className={`glass-nav-item pressable focus-ring ${isActive ? 'is-active' : ''}`}
      >
        <span className="material-icons-round glass-nav-icon">{item.icon}</span>
        <span className="glass-nav-label">{item.label}</span>
      </button>
    );
  };

  return (
    <nav data-haptic="off" data-active={active} className="glass-rail fixed z-50 flex items-center justify-between px-3 py-2">
      <span className="glass-nav-beacon" aria-hidden="true" />
      {items.slice(0, 2).map(renderItem)}

      <div className="relative -mt-7 flex w-[68px] justify-center">
        <StarBorder
          as="button"
          aria-label="新增训练"
          onClick={() => onNavigate('record')}
          className="focus-ring group relative h-[64px] w-[64px] rounded-[27px] text-white ring-4 ring-background-dark/65 transition-all duration-200 active:scale-90"
          contentClassName="nav-fab-content h-[61px] w-full rounded-[26px]"
          color="#d8fbff"
          speed="4s"
          thickness={1.5}
        >
          <span className="absolute inset-0 rounded-[26px] bg-gradient-to-br from-white/30 via-transparent to-black/18 opacity-90"></span>
          <span className="material-icons-round relative text-[34px] transition-transform duration-200 group-active:rotate-90">add</span>
        </StarBorder>
      </div>

      {items.slice(2).map(renderItem)}
    </nav>
  );
};

export default BottomNav;
