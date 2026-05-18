import React, { useRef, useState } from 'react';

interface Position {
  x: number;
  y: number;
}

interface SpotlightCardProps extends React.PropsWithChildren {
  className?: string;
  spotlightColor?: string;
  spotlightOpacity?: number;
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(46, 233, 255, 0.18)',
  spotlightOpacity = 0.7,
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const touchTimerRef = useRef<number | null>(null);

  const updatePosition = (clientX: number, clientY: number) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: clientX - rect.left, y: clientY - rect.top });
  };

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    updatePosition(event.clientX, event.clientY);
  };

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    updatePosition(event.clientX, event.clientY);
    setOpacity(spotlightOpacity);

    if (event.pointerType !== 'mouse') {
      if (touchTimerRef.current) window.clearTimeout(touchTimerRef.current);
      touchTimerRef.current = window.setTimeout(() => setOpacity(0), 260);
    }
  };

  return (
    <div
      ref={divRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerEnter={() => setOpacity(spotlightOpacity)}
      onPointerLeave={() => setOpacity(0)}
      onFocus={() => setOpacity(spotlightOpacity)}
      onBlur={() => setOpacity(0)}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity,
          background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 68%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default SpotlightCard;
