import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface NotificationSkeletonProps {
  count?: number;
}

export const NotificationSkeleton: React.FC<NotificationSkeletonProps> = ({ count = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-4">
              {/* Icon skeleton */}
              <Skeleton className="flex-shrink-0 w-10 h-10 rounded-full" />
              
              {/* Content skeleton */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-12" />
                </div>
                
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                
                <div className="flex space-x-2 pt-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              </div>
              
              {/* Unread indicator skeleton */}
              <Skeleton className="flex-shrink-0 w-2 h-2 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 