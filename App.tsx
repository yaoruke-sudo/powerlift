
import React, { useState, useEffect, useCallback } from 'react';
import Splash from './pages/Splash';
import Dashboard from './pages/Dashboard';
import RecordWorkout from './pages/RecordWorkout';
import WorkoutSummary from './pages/WorkoutSummary';
import CalendarView from './pages/CalendarView';
import ProfileView from './pages/ProfileView';
import PrivacyPolicyView from './pages/PrivacyPolicyView';
import PrivacyDialog from './components/PrivacyDialog';
import { ViewState, UserStats, WorkoutSession } from './types';
import { fetchUserStats, fetchWorkouts, DEFAULT_USER_ID } from './services/api';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('splash');
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({ height: 0, weight: 0, bmi: 0 });
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [targetDate, setTargetDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    setCurrentView('dashboard');
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
      setCurrentView('summary');
    } else {
      setCurrentView('record');
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
      setCurrentView('summary');
    } else {
      // Cancelled or no save
      // If we have history, go to summary of most recent, else dashboard
      if (workoutHistory.length > 0) {
        setSelectedSession(workoutHistory[0]);
        setCurrentView('summary');
      } else {
        setCurrentView('dashboard');
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
            setCurrentView('dashboard');
          }
        }} />;
      case 'dashboard':
        return <Dashboard
          userStats={userStats}
          onNavigate={(v) => {
            setTargetDate(null); // Reset date when starting from dashboard
            setCurrentView(v);
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
              setCurrentView('summary');
            } else {
              setCurrentView('record');
            }
          }}
          onSelectSession={(session) => {
            setSelectedSession(session);
            setCurrentView('summary');
          }}
          onNavigate={(v) => setCurrentView(v)}
        />;

      case 'record':
        return <RecordWorkout
          initialDate={targetDate || undefined}
          onBack={() => setCurrentView('dashboard')}
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
            setCurrentView('record');
          }}
          onNavigate={(v) => setCurrentView(v)}
          onDataChanged={loadData}
        />;



      case 'privacy':
        return <PrivacyPolicyView onNavigate={(v) => setCurrentView(v)} />;

      case 'profile':
        return (
          <ProfileView
            onNavigate={(v) => setCurrentView(v)}
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
        return <Dashboard userStats={userStats} onNavigate={(v) => setCurrentView(v)} />;
    }
  };

  // 数据加载中显示加载动画
  if (isLoading && currentView !== 'splash') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background-dark">
        <div className="animate-pulse text-primary text-xl font-black">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background-dark overflow-hidden">
      <div className="w-full max-w-md h-full bg-background-dark relative shadow-2xl overflow-hidden flex flex-col">
        {renderView()}
      </div>
      {/* 首次启动隐私政策弹窗 */}
      {showPrivacyDialog && <PrivacyDialog onAgree={handlePrivacyAgree} />}
    </div>
  );
};

export default App;
