import { useCallback, useEffect, useRef, useState } from 'react';

interface CountUpProps {
  to: number;
  from?: number;
  direction?: 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

const getDecimalPlaces = (num: number): number => {
  const str = num.toString();
  if (!str.includes('.')) return 0;

  const decimals = str.split('.')[1];
  return parseInt(decimals, 10) !== 0 ? decimals.length : 0;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export default function CountUp({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 0.9,
  className = '',
  startWhen = true,
  separator = '',
  onStart,
  onEnd,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<number | null>(null);
  const [isInView, setIsInView] = useState(false);

  const maxDecimals = Math.max(getDecimalPlaces(from), getDecimalPlaces(to));

  const formatValue = useCallback(
    (latest: number) => {
      const hasDecimals = maxDecimals > 0;
      const options: Intl.NumberFormatOptions = {
        useGrouping: Boolean(separator),
        minimumFractionDigits: hasDecimals ? maxDecimals : 0,
        maximumFractionDigits: hasDecimals ? maxDecimals : 0,
      };

      const formattedNumber = Intl.NumberFormat('en-US', options).format(latest);
      return separator ? formattedNumber.replace(/,/g, separator) : formattedNumber;
    },
    [maxDecimals, separator],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startValue = direction === 'down' ? to : from;
    const endValue = direction === 'down' ? from : to;

    el.textContent = formatValue(reducedMotion ? endValue : startValue);

    if (!startWhen || !isInView || reducedMotion) return;

    let startTime = 0;
    let delayTimer = 0;

    onStart?.();

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / Math.max(duration * 1000, 1), 1);
      const value = startValue + (endValue - startValue) * easeOutCubic(progress);

      el.textContent = formatValue(value);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        onEnd?.();
      }
    };

    delayTimer = window.setTimeout(() => {
      frameRef.current = requestAnimationFrame(animate);
    }, delay * 1000);

    return () => {
      window.clearTimeout(delayTimer);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [delay, direction, duration, formatValue, from, isInView, onEnd, onStart, startWhen, to]);

  return <span className={className} ref={ref} />;
}
