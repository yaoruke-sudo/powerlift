
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import Splash from './pages/Splash';
import Dashboard from './pages/Dashboard';
import RecordWorkout from './pages/RecordWorkout';
import WorkoutSummary from './pages/WorkoutSummary';
import CalendarView from './pages/CalendarView';
import ProfileView from './pages/ProfileView';
import PrivacyPolicyView from './pages/PrivacyPolicyView';
import PrivacyDialog from './components/PrivacyDialog';
import MicroFeedback from './components/MicroFeedback';
import TrainingReactor3D from './components/TrainingReactor3D';
import { ClickSpark } from './components/reactbits';
import { ViewState, UserStats, WorkoutSession } from './types';
import { fetchUserStats, fetchWorkouts, DEFAULT_USER_ID } from './services/api';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('splash');
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({ height: 0, weight: 0, bmi: 0 });
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [targetDate, setTargetDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentViewRef = useRef<ViewState>('splash');
  const viewHistoryRef = useRef<ViewState[]>([]);

  const goToDashboard = useCallback(() => {
    viewHistoryRef.current = [];
    setTargetDate(null);
    setSelectedSession(null);
    currentViewRef.current = 'dashboard';
    setCurrentView('dashboard');
  }, []);

  const navigateTo = useCallback((nextView: ViewState, options: { replace?: boolean } = {}) => {
    const activeView = currentViewRef.current;
    if (nextView === activeView) return;

    if (nextView === 'dashboard') {
      goToDashboard();
      return;
    }

    if (options.replace) {
      const lastHistoryView = viewHistoryRef.current[viewHistoryRef.current.length - 1];
      if (lastHistoryView === nextView) {
        viewHistoryRef.current.pop();
      }
    } else if (activeView !== 'splash') {
      const lastHistoryView = viewHistoryRef.current[viewHistoryRef.current.length - 1];
      if (lastHistoryView !== activeView) {
        viewHistoryRef.current.push(activeView);
      }
    }

    currentViewRef.current = nextView;
    setCurrentView(nextView);
  }, [goToDashboard]);

  const handleHardwareBack = useCallback(() => {
    const previousView = viewHistoryRef.current.pop();

    if (previousView) {
      if (previousView === 'dashboard') {
        goToDashboard();
      } else {
        currentViewRef.current = previousView;
        setCurrentView(previousView);
      }
      return true;
    }

    if (currentViewRef.current !== 'dashboard' && currentViewRef.current !== 'splash') {
      goToDashboard();
      return true;
    }

    return false;
  }, [goToDashboard]);

  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  useEffect(() => {
    let backButtonListener: { remove: () => Promise<void> } | undefined;

    CapacitorApp.addListener('backButton', () => {
      if (!handleHardwareBack()) {
        void CapacitorApp.exitApp();
      }
    }).then(listener => {
      backButtonListener = listener;
    });

    return () => {
      void backButtonListener?.remove();
    };
  }, [handleHardwareBack]);

  // 隐私政策同意状态，从 localStorage 读取
  const [privacyAgreed, setPrivacyAgreed] = useState<boolean>(
    () => localStorage.getItem('privacy_agreed') === 'true'
  );
  // 是否需要显示隐私弹窗（仅在从 splash 进入主页面时触发）
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);

  const handlePrivacyAgree = () => {
    localStorage.setItem('privacy_agreed', 'true');
    setPrivacyAgreed(true);
    setShowPrivacyDialog(false);
    goToDashboard();
  };

  /**
   * 从后端加载核心数据（用户统计 + 训练记录）
   * 在首次进入和训练保存后调用
   */
  const loadData = useCallback(async () => {
    try {
      const [stats, workouts] = await Promise.all([
        fetchUserStats(DEFAULT_USER_ID),
        fetchWorkouts(DEFAULT_USER_ID),
      ]);
      setUserStats(stats);
      setWorkoutHistory(workouts);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDateSelect = (date: string) => {
    const hasData = workoutHistory.some(s => s.date === date);
    setTargetDate(date);
    setSelectedSession(null);
    if (hasData) {
      navigateTo('summary');
    } else {
      navigateTo('record');
    }
  };


  /**
   * 训练记录保存成功后，手动更新本地状态，避免重新拉取全量数据
   */

  /**
   * 训练记录保存成功后，手动更新本地状态，避免重新拉取全量数据
   */
  const handleWorkoutSaved = async (savedSession?: WorkoutSession) => {
    if (savedSession) {
      // 1. 更新历史列表
      setWorkoutHistory(prev => {
        const index = prev.findIndex(s => s.id === savedSession.id);
        if (index >= 0) {
          // Update existing
          const newHistory = [...prev];
          newHistory[index] = savedSession;
          return newHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } else {
          // Add new
          return [savedSession, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
      });

      // 2. 异步静默刷新用户统计
      fetchUserStats(DEFAULT_USER_ID).then(stats => setUserStats(stats));

      // 3. 立即跳转
      setSelectedSession(savedSession);
      navigateTo('summary', { replace: true });
    } else {
      // Cancelled or no save
      // If we have history, go to summary of most recent, else dashboard
      if (workoutHistory.length > 0) {
        setSelectedSession(workoutHistory[0]);
        navigateTo('summary', { replace: true });
      } else {
        goToDashboard();
      }
    }
  };


  const renderView = () => {
    switch (currentView) {
      case 'splash':
        return <Splash onStart={() => {
          // 首次启动且未同意隐私政策时，显示弹窗
          if (!privacyAgreed) {
            setShowPrivacyDialog(true);
          } else {
            goToDashboard();
          }
        }} />;
      case 'dashboard':
        return <Dashboard
          userStats={userStats}
          onNavigate={(v) => {
            setTargetDate(null); // Reset date when starting from dashboard
            setSelectedSession(null);
            navigateTo(v);
          }}
          onUserStatsUpdated={(stats) => setUserStats(stats)}
        />;
      case 'calendar':
        return <CalendarView
          history={workoutHistory}
          onSelectDate={(date) => {
            const hasData = workoutHistory.some(s => s.date === date);
            setTargetDate(date);
            if (hasData) {
              setSelectedSession(null);
              navigateTo('summary');
            } else {
              navigateTo('record');
            }
          }}
          onSelectSession={(session) => {
            setSelectedSession(session);
            navigateTo('summary');
          }}
          onNavigate={(v) => navigateTo(v)}
        />;

      case 'record':
        return <RecordWorkout
          initialDate={targetDate || undefined}
          onBack={() => { handleHardwareBack(); }}
          onSave={handleWorkoutSaved}
        />;
      case 'summary':
        // Default to today if no date selected
        const displayDate = targetDate || new Date().toISOString().split('T')[0];
        const daySessions = workoutHistory.filter(s => s.date === displayDate);

        return <WorkoutSummary
          session={selectedSession}
          date={displayDate}
          daySessions={daySessions}
          onSelectSession={(s) => setSelectedSession(s)}
          onCreateNew={() => {
            setTargetDate(displayDate);
            navigateTo('record');
          }}
          onNavigate={(v) => navigateTo(v)}
          onDataChanged={loadData}
        />;



      case 'privacy':
        return <PrivacyPolicyView onNavigate={(v) => navigateTo(v)} />;

      case 'profile':
        return (
          <ProfileView
            onNavigate={(v) => navigateTo(v)}
            onProfileUpdated={(profile) => {
              // “我的”中修改身高体重后，立刻同步到统计用的 userStats
              setUserStats({
                height: profile.height,
                weight: profile.weight,
                bmi: profile.bmi,
              });
            }}
          />
        );
      default:
        return <Dashboard userStats={userStats} onNavigate={(v) => navigateTo(v)} />;
    }
  };

  // 数据加载中显示加载动画
  if (isLoading && currentView !== 'splash') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 rounded-full border border-primary/20"></div>
            <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-primary animate-spin"></div>
            <div className="absolute inset-4 rounded-full bg-primary shadow-[0_0_24px_rgba(242,108,13,0.45)]"></div>
          </div>
          <div className="text-primary text-sm font-black tracking-[0.24em] uppercase">加载训练数据</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background-dark overflow-hidden">
      <MicroFeedback />
      <ClickSpark
        className="app-shell kinetic-shell w-full max-w-md h-full bg-background-dark relative shadow-2xl overflow-hidden flex flex-col"
        sparkColor="#f26c0d"
        sparkSize={8}
        sparkRadius={18}
        sparkCount={8}
        duration={360}
      >
        <TrainingReactor3D />
        <div className="app-view-layer h-full w-full">
          {renderView()}
        </div>
      </ClickSpark>
      {/* 首次启动隐私政策弹窗 */}
      {showPrivacyDialog && <PrivacyDialog onAgree={handlePrivacyAgree} />}
    </div>
  );
};

export default App;
