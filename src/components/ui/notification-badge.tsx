import React from 'react';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  className?: string;
  showZero?: boolean;
  maxCount?: number;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  className,
  showZero = false,
  maxCount = 99
}) => {
  if (count === 0 && !showZero) {
    return null;
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <span
      className={cn(
        "absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground",
        "flex items-center justify-center text-xs font-medium",
        "animate-pulse shadow-sm",
        count > 0 && "animate-bounce",
        className
      )}
    >
      {displayCount}
    </span>
  );
}; 