import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card.tsx';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  valueClassName?: string;
  className?: string;
}

const StatCard = ({
  title,
  value,
  icon,
  trend,
  valueClassName,
  className
}: StatCardProps) => {
  return (
    <Card className={cn("animate-fade-up shadow-purple", className)}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn("text-2xl font-bold mt-1", valueClassName)}>{value}</p>
            
            {trend && (
              <div className="flex items-center mt-1">
                <div className={cn(
                  "text-xs font-medium mr-1 px-1.5 py-0.5 rounded-sm",
                  trend.isPositive 
                    ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
                    : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                )}>
                  {trend.value}%
                </div>
                <p className="text-xs text-muted-foreground">vs. previous period</p>
              </div>
            )}
          </div>
          
          {icon && (
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default StatCard;
