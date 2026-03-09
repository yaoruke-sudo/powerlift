
import React, { useState, useRef, useCallback } from 'react';

interface SplashProps {
  onStart: () => void;
}

/**
 * Splash 启动页 —— 支持左右滑动切换多页语录
 * 每页保持相同的视觉风格，底部有页面指示器和开始按钮
 */
const Splash: React.FC<SplashProps> = ({ onStart }) => {
  const [currentPage, setCurrentPage] = useState(0);
  // 滑动相关状态
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  // 页面内容配置
  const pages = [
    {
      lines: ['今天别忘喝肌酸', '明天也别忘'],
      author: '姚大大可',
      subtitle: 'READY TO LIFT',
    },
    {
      lines: ['不管怎么说', '能行动起来就很厉害'],
      author: '张小小涵',
      subtitle: 'KEEP MOVING',
    },
  ];

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    setDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const delta = e.touches[0].clientX - touchStartX.current;
    touchDeltaX.current = delta;
    setDragOffset(delta);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
    const threshold = 60;
    if (touchDeltaX.current < -threshold && currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1);
    } else if (touchDeltaX.current > threshold && currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
    setDragOffset(0);
  }, [currentPage, pages.length]);

  // 鼠标事件支持（桌面端调试用）
  const mouseStartX = useRef(0);
  const mouseDown = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    mouseStartX.current = e.clientX;
    mouseDown.current = true;
    touchDeltaX.current = 0;
    setDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!mouseDown.current) return;
    const delta = e.clientX - mouseStartX.current;
    touchDeltaX.current = delta;
    setDragOffset(delta);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!mouseDown.current) return;
    mouseDown.current = false;
    setDragging(false);
    const threshold = 60;
    if (touchDeltaX.current < -threshold && currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1);
    } else if (touchDeltaX.current > threshold && currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
    setDragOffset(0);
  }, [currentPage, pages.length]);

  return (
    <div className="relative h-full w-full flex flex-col bg-warm-dark overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCl8dinTIFK9Rb-cTeuXMRCj_BF7_bqfhDXe5LzwsxGRPS6oYMTBFooVikJvnJOPiCVqaCpLtITCfgQcjrTy8xtTiNrbFulv5z-TFbvA1XSDdbDH0ekcSJXf20VuivaYt3BoxbMWKiYEcxLlVHz-TiaY1vwVJnKIr_mT1SuneDzIzuCJ0QvoN1L789l0G2Ghd4t_4KEuqofCWIlI74xsdySvwrD1Od021yuD9M59mQUm50HgZTNNq79940KEIlKrC687lqksNVIy4s"
          alt="Gym background"
          className="w-full h-full object-cover opacity-20 grayscale mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-warm-dark via-warm-dark/90 to-warm-dark z-10"></div>
      </div>

      {/* 可滑动内容区域 */}
      <main
        className="relative z-20 flex-1 overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* 滑动页面容器：每页占 100% 宽度，通过 translateX 切换 */}
        <div
          style={{
            display: 'flex',
            transform: `translateX(calc(-${currentPage * 100}% + ${dragging ? dragOffset : 0}px))`,
            transition: dragging ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            height: '100%',
          }}
        >
          {pages.map((page, idx) => (
            <div
              key={idx}
              style={{ minWidth: '100%', width: '100%' }}
              className="flex flex-col justify-center items-center px-8 text-center"
            >
              <div className="space-y-6">
                <h1 className="text-5xl font-black tracking-tight leading-tight text-white">
                  {page.lines.map((line, i) => (
                    <span key={i} className={`block ${i === 0 ? 'mb-2' : 'text-white/90'}`}>
                      {line}
                    </span>
                  ))}
                  <span className="block text-sm text-white/60 mt-3">—— {page.author}</span>
                </h1>

                <div className="flex justify-center items-center">
                  <div className="h-1.5 w-24 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full shadow-[0_0_15px_rgba(242,108,13,0.8)]"></div>
                </div>

                <p className="text-white/40 text-sm font-display tracking-[0.2em] uppercase mt-4">
                  {page.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* 页面指示器 */}
      <div className="relative z-20 flex justify-center gap-2 pb-6">
        {pages.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentPage(idx)}
            className={`rounded-full transition-all duration-300 ${idx === currentPage
                ? 'w-8 h-2 bg-primary shadow-[0_0_10px_rgba(242,108,13,0.6)]'
                : 'w-2 h-2 bg-white/20 hover:bg-white/40'
              }`}
          />
        ))}
      </div>

      <footer className="relative z-20 px-8 pb-16">
        <button
          onClick={onStart}
          className="group w-full bg-primary hover:bg-primary/90 text-white font-bold text-xl py-5 px-8 rounded-2xl shadow-[0_8px_40px_rgba(242,108,13,0.4)] transition-all duration-300 transform active:scale-95 flex items-center justify-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <span className="relative z-10 flex items-center gap-2">
            开始记录
            <span className="material-icons-round">arrow_forward</span>
          </span>
        </button>
      </footer>
    </div>
  );
};

export default Splash;
