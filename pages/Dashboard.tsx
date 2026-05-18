
import React, { useState, useEffect, useMemo } from 'react';
import { UserStats, ViewState, ExerciseType } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { EXERCISE_INFO } from '../constants';
import BottomNav from '../components/BottomNav';
import { AnimatedContent, AnimatedList, CountUp, FadeContent, GlareHover, SpotlightCard } from '../components/reactbits';
import { fetchPrRecords, fetchTrends, fetchUserProfile, updateUserProfile, DEFAULT_USER_ID } from '../services/api';

interface DashboardProps {
  userStats: UserStats;
  onNavigate: (view: ViewState) => void;
  // 编辑身高体重后通知 App 层刷新 userStats，保持与 ProfileView 同步
  onUserStatsUpdated?: (stats: UserStats) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userStats, onNavigate, onUserStatsUpdated }) => {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>(ExerciseType.BENCH_PRESS);
  const [chartData, setChartData] = useState<{ date: string; weight: number }[]>([]);
  const [prRecords, setPrRecords] = useState<Record<string, number>>({});
  // 控制运动选择弹窗的显示状态
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  // 身高体重编辑弹窗状态
  const [showBodyEditor, setShowBodyEditor] = useState(false);
  const [editHeight, setEditHeight] = useState(String(userStats.height));
  const [editWeight, setEditWeight] = useState(String(userStats.weight));
  const [isSaving, setIsSaving] = useState(false);

  // 趋势图时间范围：D=最近7次训练, M=按月聚合最近7个月
  const [timeRange, setTimeRange] = useState<'D' | 'M'>('D');

  // 加载 PR 记录（仅初始化时加载一次）
  useEffect(() => {
    fetchPrRecords(DEFAULT_USER_ID)
      .then(setPrRecords)
      .catch((err) => console.error('加载 PR 记录失败:', err));
  }, []);

  // 切换运动类型时加载对应趋势数据（全量拉取，前端按时间范围处理）
  useEffect(() => {
    fetchTrends(selectedExercise, DEFAULT_USER_ID)
      .then(setChartData)
      .catch((err) => console.error('加载趋势数据失败:', err));
  }, [selectedExercise]);

  // 根据时间范围处理图表数据
  const filteredChartData = useMemo(() => {
    if (timeRange === 'D') {
      // D：取最近 7 次训练记录
      return chartData.slice(-7);
    } else {
      // M：按月聚合，每月取最大重量，最多返回最近 7 个月
      const monthMap = new Map<string, number>();
      chartData.forEach(point => {
        // chartData 的 date 格式为 MM-DD，用 MM 作为 key
        const month = point.date.substring(0, 2);
        const prev = monthMap.get(month) ?? 0;
        if (point.weight > prev) monthMap.set(month, point.weight);
      });
      // 按月份排序后取最近 7 个月
      const sorted = Array.from(monthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-7);
      return sorted.map(([month, weight]) => ({ date: month + '月', weight }));
    }
  }, [chartData, timeRange]);

  const currentPR = prRecords[selectedExercise] || 0;
  const selectedInfo = EXERCISE_INFO[selectedExercise] || { name: selectedExercise, icon: 'fitness_center' };
  const isCardioSelected = selectedExercise === ExerciseType.INCLINE_CARDIO;
  const metricUnit = isCardioSelected ? 'km/h' : 'KG';
  const metricLabel = isCardioSelected ? 'BEST SPEED / 最佳速度' : 'MAX WEIGHT / 极限';
  const prProgress = Math.min(100, Math.max(currentPR > 0 ? 8 : 0, (currentPR / (isCardioSelected ? 15 : 200)) * 100));

  // 打开编辑弹窗时，用当前 userStats 初始化表单
  const handleOpenBodyEditor = () => {
    setEditHeight(String(userStats.height));
    setEditWeight(String(userStats.weight));
    setShowBodyEditor(true);
  };

  // 保存编辑后的身高体重，调用后端 API 并同步到 App 层
  const handleSaveBodyStats = async () => {
    setIsSaving(true);
    try {
      const profile = await fetchUserProfile(DEFAULT_USER_ID);
      const h = parseFloat(editHeight) || 0;
      const w = parseFloat(editWeight) || 0;
      const heightInM = h / 100;
      const bmi = heightInM > 0 ? Number((w / (heightInM * heightInM)).toFixed(1)) : 0;

      await updateUserProfile(profile.id, {
        height: h,
        weight: w,
        bmi,
      });

      const newStats: UserStats = { height: h, weight: w, bmi };
      onUserStatsUpdated?.(newStats);
      setShowBodyEditor(false);
    } catch (err: any) {
      console.error('保存身体数据失败:', err);
      alert(`保存失败: ${err.message || '未知错误'}`);
    } finally {
      setIsSaving(false);
    }
  };
  // 合并预设类型、EXERCISE_INFO 注册类型、以及用户保存的自定义运动
  // 过滤掉不属于任何合法来源的脏数据（如数据库残留的 "Squat"）
  const exerciseValues = new Set<string>(Object.values(ExerciseType));
  const customExerciseTypes = new Set<string>();
  try {
    const saved = localStorage.getItem('custom_exercises');
    if (saved) {
      const customs: { type: string }[] = JSON.parse(saved);
      customs.forEach((ex) => customExerciseTypes.add(ex.type));
    }
  } catch { /* 忽略解析错误 */ }
  const validPrKeys = Object.keys(prRecords).filter(
    (key) => exerciseValues.has(key) || key in EXERCISE_INFO || customExerciseTypes.has(key)
  );
  const allExercises = Array.from(new Set([...Object.values(ExerciseType), ...validPrKeys]));

  return (
    <div className="flex flex-col h-full screen-surface overflow-hidden">
      <header className="compact-dashboard-header px-5 pt-5 pb-3 shrink-0">
        <AnimatedContent distance={10} duration={360}>
          <section className="cockpit-panel dashboard-hero rounded-[1.75rem] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="signal-chip rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em]">
                  <span className="signal-dot" />
                  Lift Ops Live
                </div>
                <h1 className="holo-title mt-3 text-4xl font-black leading-none text-white">统计中心</h1>
                <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Personal Records Command
                </p>
              </div>
              <div className="reactor-badge shrink-0">
                <span className="material-icons-round text-3xl text-primary">bolt</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: 'PR', value: currentPR > 0 ? currentPR : '待破' },
                { label: '趋势点', value: filteredChartData.length },
                { label: '模式', value: timeRange },
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

      {/* 当前选中运动 —— 突出显示卡片，点击展开弹窗 */}
      <section className="px-6 pb-4">
        <GlareHover
          className="command-card exercise-command w-full rounded-2xl"
          borderRadius="16px"
          background="transparent"
          borderColor="transparent"
          glareColor="#ffffff"
          glareOpacity={0.16}
        >
          <button
            onClick={() => setShowExercisePicker(true)}
            className="pressable focus-ring w-full rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:bg-primary/10 text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="material-icons-round text-2xl text-primary">{selectedInfo.icon}</span>
            </div>
            <div className="flex-1 text-left">
              <div className="text-white font-black text-base">{selectedInfo.name}</div>
              <div className="text-primary text-xs font-bold mt-0.5">
                {currentPR > 0 ? `${isCardioSelected ? '最佳' : '极限'} ${currentPR} ${metricUnit}` : '暂无记录'}
              </div>
            </div>
            <span className="material-icons-round text-slate-400 text-xl">expand_more</span>
          </button>
        </GlareHover>
      </section>

      {/* 运动选择弹窗 —— 底部弹出式面板 */}
      {showExercisePicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center fade-enter">
          {/* 遮罩层 */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowExercisePicker(false)}
          />
          {/* 弹窗内容 */}
          <div className="sheet-enter glass-sheet relative w-full max-w-md rounded-t-3xl border-t p-6 pb-10 max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-white">选择运动项目</h3>
              <button
                onClick={() => setShowExercisePicker(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
              >
                <span className="material-icons-round text-slate-400 text-sm">close</span>
              </button>
            </div>
            {/* 拖拽指示条 */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/10" />
            <AnimatedList className="overflow-y-auto space-y-2 scrollbar-hide pb-4" staggerDelay={28} distance={10}>
              {allExercises.map((type) => {
                const info = EXERCISE_INFO[type as ExerciseType] || { name: type, icon: 'fitness_center' };
                const pr = prRecords[type];
                const isActive = selectedExercise === type;
                const unit = type === ExerciseType.INCLINE_CARDIO ? 'km/h' : 'KG';

                return (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedExercise(type as ExerciseType);
                      setShowExercisePicker(false);
                    }}
                    className={`w-full flex items-center gap-4 p-3 rounded-2xl border transition-all duration-200
                      ${isActive
                        ? 'bg-primary/15 border-primary/40 shadow-lg shadow-primary/10'
                        : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'}
                    `}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-primary/20' : 'bg-white/5'}`}>
                      <span className={`material-icons-round text-xl ${isActive ? 'text-primary' : 'text-slate-500'}`}>{info.icon}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`font-black text-sm ${isActive ? 'text-white' : 'text-slate-300'}`}>{info.name}</div>
                    </div>
                    <div className="text-right">
                      {pr ? (
                        <span className={`text-sm font-black ${isActive ? 'text-primary' : 'text-slate-400'}`}>{pr} {unit}</span>
                      ) : (
                        <span className="text-xs font-bold text-slate-600">—</span>
                      )}
                    </div>
                    {isActive && (
                      <span className="material-icons-round text-primary text-lg">check_circle</span>
                    )}
                  </button>
                );
              })}
            </AnimatedList>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto scrollbar-hide px-6 pb-32 space-y-8">
        {/* 身体数据卡片 */}
        <SpotlightCard className="chrome-card body-console rounded-3xl p-6">
          <div className="flex justify-between divide-x divide-white/5">
            {[
              { label: '身高', value: userStats.height, unit: 'CM', editable: true },
              { label: '体重', value: userStats.weight, unit: 'KG', editable: true },
              { label: 'BMI', value: userStats.bmi, unit: '', highlight: true, editable: false }
            ].map((stat, i) => (
              <div
                key={i}
                className={`flex flex-col items-center flex-1 ${stat.editable ? 'cursor-pointer group/stat' : ''}`}
                onClick={stat.editable ? handleOpenBodyEditor : undefined}
              >
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  {stat.label}
                  {stat.editable && <span className="material-icons-round text-[10px] text-slate-600">edit</span>}
                </span>
                <div className="flex items-baseline gap-1">
                  <CountUp
                    to={Number(stat.value) || 0}
                    duration={0.7}
                    className={`text-2xl font-black font-display ${stat.highlight ? 'text-primary' : 'text-white'}`}
                  />
                  <span className="text-[10px] font-bold text-slate-600">{stat.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </SpotlightCard>

        {/* PR 展示卡片（数据来自后端） */}
        <SpotlightCard
          className="chrome-card hero-readout rounded-3xl p-6 relative overflow-hidden group"
          spotlightColor="rgba(46, 233, 255, 0.2)"
        >
          <div className="absolute right-5 top-5 flex h-16 items-end gap-1 opacity-35">
            {[34, 52, 42, 64, 48].map((height, index) => (
              <span
                key={index}
                className="w-1 rounded-full bg-primary"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>

          <div className="relative z-10 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{metricLabel}</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <CountUp
                  to={currentPR}
                  duration={0.85}
                  className="text-6xl font-black text-white font-display tracking-tighter"
                />
                <span className="text-xl font-black text-primary font-display">{metricUnit}</span>
              </div>
              <div className="power-bar mt-5 h-2 w-40 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-orange-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${prProgress}%` }}
                />
              </div>
              {/* 基于最近两次训练记录对比，展示实际涨跌幅度 */}
              {(() => {
                if (chartData.length < 2) {
                  return (
                    <div className="mt-4 flex items-center text-[10px] font-black tracking-widest uppercase">
                      <span className="material-icons-round text-sm mr-1 text-slate-500">remove</span>
                      <span className="text-slate-500">数据不足，暂无对比</span>
                    </div>
                  );
                }
                const prev = chartData[chartData.length - 2].weight;
                const latest = chartData[chartData.length - 1].weight;
                const diff = prev > 0 ? ((latest - prev) / prev) * 100 : 0;
                const absDiff = Math.abs(diff).toFixed(1);
                const isUp = diff > 0;
                const isFlat = diff === 0;
                // 上次训练日期，chartData.date 格式为 MM-DD
                const prevDate = chartData[chartData.length - 2].date;
                const latestDate = chartData[chartData.length - 1].date;

                if (isFlat) {
                  return (
                    <div className="mt-4 flex items-center text-[10px] font-black tracking-widest uppercase">
                      <span className="material-icons-round text-sm mr-1 text-slate-400">trending_flat</span>
                      <span className="text-slate-400 mr-2">持平</span>
                      <span className="text-slate-500">VS {prevDate}</span>
                    </div>
                  );
                }

                return (
                  <div className="mt-4 flex items-center text-[10px] font-black tracking-widest uppercase">
                    <span className={`material-icons-round text-sm mr-1 ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                      {isUp ? 'trending_up' : 'trending_down'}
                    </span>
                    <span className={`mr-2 ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                      {isUp ? '+' : '-'}{absDiff}%
                    </span>
                    <span className="text-slate-500">VS {prevDate}</span>
                  </div>
                );
              })()}
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-primary border border-white/5">
              <span className="material-icons-round text-3xl">{(EXERCISE_INFO[selectedExercise] || { icon: 'fitness_center' }).icon}</span>
            </div>
          </div>
        </SpotlightCard>

        {/* 趋势图表（数据来自后端） */}
        <FadeContent blur duration={480}>
          <section className="chrome-card chart-console rounded-3xl p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-black text-white tracking-tight">训练趋势 <span className="text-xs font-normal text-slate-500 ml-2 uppercase">Trends</span></h2>
            <div className="hud-chip rounded-xl p-1 flex border border-white/5">
              {(['D', 'M'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTimeRange(t)}
                  className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all duration-200 ${t === timeRange ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >{t}</button>
              ))}
            </div>
          </div>

          {filteredChartData.length > 0 ? (
            <div className="h-56 w-full -ml-4">
              <ResponsiveContainer width="105%" height="100%">
                <AreaChart data={filteredChartData}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff7a1a" stopOpacity={0.44} />
                      <stop offset="72%" stopColor="#2ee9ff" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#2ee9ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#101722', borderColor: '#ffffff18', borderRadius: '16px', fontWeight: 900, color: 'white' }}
                    itemStyle={{ color: '#ff7a1a' }}
                    cursor={{ stroke: '#2ee9ff', strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="#ff7a1a"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#chartGradient)"
                    dot={{ fill: '#05070b', stroke: '#ff7a1a', strokeWidth: 3, r: 5 }}
                    activeDot={{ r: 7, fill: '#2ee9ff', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-500 text-sm">暂无趋势数据</div>
          )}
          </section>
        </FadeContent>
      </main>

      {/* 身高体重编辑弹窗 —— 底部弹出式面板 */}
      {showBodyEditor && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center fade-enter">
          {/* 遮罩层 */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBodyEditor(false)}
          />
          {/* 弹窗：flex-col 三段式，按钮行不参与滚动，始终可点击 */}
          <div className="sheet-enter glass-sheet relative w-full max-w-md rounded-t-3xl border-t max-h-[80vh] flex flex-col">
            {/* 拖拽指示条 */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/10" />

            {/* 标题栏（固定，不滚动） */}
            <div className="flex items-center justify-between px-5 pt-6 pb-3 shrink-0">
              <h3 className="text-lg font-black text-white">编辑身体数据</h3>
              <button
                onClick={() => setShowBodyEditor(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
              >
                <span className="material-icons-round text-slate-400 text-sm">close</span>
              </button>
            </div>

            {/* 滚动内容区 */}
            <div className="flex-1 overflow-y-auto px-5 pb-2">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-background-dark rounded-2xl p-4 border border-white/10">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Height / 身高 (CM)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editHeight}
                    onChange={(e) => setEditHeight(e.target.value.replace(/[^0-9]/g, ''))}
                    className="bg-transparent text-2xl font-black text-white w-full focus:outline-none"
                  />
                </div>
                <div className="bg-background-dark rounded-2xl p-4 border border-white/10">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Weight / 体重 (KG)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value.replace(/[^0-9.]/g, ''))}
                    className="bg-transparent text-2xl font-black text-white w-full focus:outline-none"
                  />
                </div>
              </div>

              {/* 实时预览 BMI */}
              <div className="flex items-center justify-between bg-background-dark rounded-2xl px-4 py-3 border border-white/10">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">BMI 预览</span>
                <span className="text-2xl font-black text-primary">
                  {parseFloat(editHeight) > 0 ? (parseFloat(editWeight) / ((parseFloat(editHeight) / 100) ** 2)).toFixed(1) : '—'}
                </span>
              </div>
            </div>

            {/* 底部按钮行（固定，不滚动，始终可见） */}
            <div className="flex gap-3 px-5 pt-3 pb-8 shrink-0 border-t border-white/5">
              <button
                onClick={() => setShowBodyEditor(false)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 font-bold text-sm"
              >
                取消
              </button>
              <button
                onClick={handleSaveBodyStats}
                disabled={isSaving}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="stats" onNavigate={onNavigate} />
    </div>
  );
};

export default Dashboard;
