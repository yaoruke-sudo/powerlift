import React from 'react';

type StarBorderProps<T extends React.ElementType> = {
  as?: T;
  className?: string;
  contentClassName?: string;
  children?: React.ReactNode;
  color?: string;
  speed?: React.CSSProperties['animationDuration'];
  thickness?: number;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'children' | 'color'>;

const StarBorder = <T extends React.ElementType = 'button'>({
  as,
  className = '',
  contentClassName = '',
  color = '#f26c0d',
  speed = '5s',
  thickness = 1,
  children,
  ...rest
}: StarBorderProps<T>) => {
  const Component = (as || 'button') as React.ElementType;
  const restProps = rest as React.ComponentPropsWithoutRef<T> & { style?: React.CSSProperties };

  return (
    <Component
      className={`relative inline-block overflow-hidden rounded-[22px] ${className}`}
      {...restProps}
      style={{
        padding: `${thickness}px 0`,
        ...restProps.style,
      }}
    >
      <span
        className="absolute bottom-[-12px] right-[-250%] z-0 h-1/2 w-[300%] rounded-full opacity-70 animate-star-movement-bottom"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <span
        className="absolute left-[-250%] top-[-12px] z-0 h-1/2 w-[300%] rounded-full opacity-70 animate-star-movement-top"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <span className={`relative z-10 flex items-center justify-center ${contentClassName}`}>
        {children}
      </span>
    </Component>
  );
};

export default StarBorder;
