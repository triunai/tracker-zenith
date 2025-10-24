import React from 'react';
import { Bell, BellRing, AlertTriangle, CheckCircle, Info, DollarSign, TrendingUp, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedNotificationIconProps {
  type: 'budget_alert' | 'amount_anomaly' | 'new_merchant' | 'general';
  severity: 'info' | 'warning' | 'critical';
  isAnimated?: boolean;
  size?: number;
  className?: string;
}

export const AnimatedNotificationIcon: React.FC<AnimatedNotificationIconProps> = ({
  type,
  severity,
  isAnimated = true,
  size = 20,
  className
}) => {
  const getIcon = () => {
    switch (type) {
      case 'budget_alert':
        return <DollarSign size={size} />;
      case 'amount_anomaly':
        return <TrendingUp size={size} />;
      case 'new_merchant':
        return <Store size={size} />;
      default:
        return severity === 'critical' ? <BellRing size={size} /> : <Bell size={size} />;
    }
  };

  const getColorClasses = () => {
    switch (severity) {
      case 'critical':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getAnimationClasses = () => {
    if (!isAnimated) return '';
    
    switch (severity) {
      case 'critical':
        return 'animate-bounce';
      case 'warning':
        return 'animate-pulse';
      case 'info':
        return 'animate-pulse';
      default:
        return '';
    }
  };

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        getColorClasses(),
        getAnimationClasses(),
        className
      )}
    >
      {getIcon()}
      
      {/* Ripple effect for critical alerts */}
      {severity === 'critical' && isAnimated && (
        <div className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-20" />
      )}
      
      {/* Glow effect for warnings */}
      {severity === 'warning' && isAnimated && (
        <div className="absolute inset-0 rounded-full bg-yellow-400 opacity-10 blur-sm animate-pulse" />
      )}
    </div>
  );
}; 