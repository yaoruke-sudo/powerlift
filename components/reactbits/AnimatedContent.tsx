import React, { useEffect, useRef, useState } from 'react';

interface AnimatedContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  container?: Element | string | null;
  distance?: number;
  direction?: 'vertical' | 'horizontal';
  reverse?: boolean;
  duration?: number;
  initialOpacity?: number;
  animateOpacity?: boolean;
  scale?: number;
  threshold?: number;
  delay?: number;
  once?: boolean;
}

const AnimatedContent: React.FC<AnimatedContentProps> = ({
  children,
  container,
  distance = 24,
  direction = 'vertical',
  reverse = false,
  duration = 420,
  initialOpacity = 0,
  animateOpacity = true,
  scale = 0.98,
  threshold = 0.12,
  delay = 0,
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

  const offset = reverse ? -distance : distance;
  const translate = direction === 'horizontal' ? `translate3d(${offset}px, 0, 0)` : `translate3d(0, ${offset}px, 0)`;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: animateOpacity ? (isVisible ? 1 : initialOpacity) : 1,
        transform: isVisible ? 'translate3d(0, 0, 0) scale(1)' : `${translate} scale(${scale})`,
        transition: `opacity ${duration}ms ease, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        transitionDelay: `${delay}ms`,
        willChange: 'opacity, transform',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default AnimatedContent;
