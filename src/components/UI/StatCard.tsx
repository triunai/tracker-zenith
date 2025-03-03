
import React from 'react';
import { Card, CardContent } from "@/components/UI/card";
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  valueClassName?: string;
}

const StatCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  className,
  valueClassName
}: StatCardProps) => {
  return (
    <Card className={cn("overflow-hidden animate-scale-in", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <div className="mt-3 flex items-end justify-between">
          <h3 className={cn("text-2xl font-semibold", valueClassName)}>
            {value}
          </h3>
          {trend && (
            <div className={cn(
              "text-xs font-medium flex items-center gap-0.5",
              trend.isPositive ? "text-finance-income" : "text-finance-expense"
            )}>
              {trend.isPositive ? '↑' : '↓'}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
