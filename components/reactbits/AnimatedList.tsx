import React from 'react';
import AnimatedContent from './AnimatedContent';

interface AnimatedListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  itemClassName?: string;
  staggerDelay?: number;
  distance?: number;
}

const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  className = '',
  itemClassName = '',
  staggerDelay = 45,
  distance = 18,
  ...props
}) => {
  const items = React.Children.toArray(children);

  return (
    <div className={className} {...props}>
      {items.map((child, index) => (
        <AnimatedContent
          key={(child as React.ReactElement<{ key?: React.Key }>).key ?? index}
          className={itemClassName}
          delay={index * staggerDelay}
          distance={distance}
          duration={360}
        >
          {child}
        </AnimatedContent>
      ))}
    </div>
  );
};

export default AnimatedList;
