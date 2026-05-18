import React, { useEffect, useRef, useState } from 'react';

interface FadeContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  container?: Element | string | null;
  blur?: boolean;
  duration?: number;
  delay?: number;
  threshold?: number;
  initialOpacity?: number;
  once?: boolean;
}

const FadeContent: React.FC<FadeContentProps> = ({
  children,
  container,
  blur = false,
  duration = 420,
  delay = 0,
  threshold = 0.12,
  initialOpacity = 0,
  once = true,
  className = '',
  style,
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    let root: Element | null = null;
    if (typeof container === 'string') {
      root = document.querySelector(container);
    } else if (container instanceof Element) {
      root = container;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { root, threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [container, once, threshold]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : initialOpacity,
        filter: blur && !isVisible ? 'blur(10px)' : 'blur(0)',
        transition: `opacity ${duration}ms ease, filter ${duration}ms ease`,
        transitionDelay: `${delay}ms`,
        willChange: 'opacity, filter',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default FadeContent;
