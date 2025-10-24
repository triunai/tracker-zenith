import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead, archiveNotification } from '@/lib/api/notificationsApi';
import { Notification } from '@/interfaces/notification-interface';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, X, Inbox, Search, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// A standalone, reusable custom hook for optimistic updates on a list.
const useOptimisticMutation = (mutationFn: (id: number) => Promise<boolean>, queryKey: string[]) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<Notification[]>(queryKey);
      queryClient.setQueryData<Notification[]>(queryKey, old => old?.filter(n => n.id !== id));
      return { previousData };
    },
    onError: (err, id, context) => {
      // Roll back on error
      queryClient.setQueryData(queryKey, context?.previousData);
    },
    onSettled: () => {
      // Refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    },
  });
};

const NotificationItem = ({ 
  notification, 
  onMarkAsRead,
  onArchive
}: { 
  notification: Notification, 
  onMarkAsRead: (id: number) => void,
  onArchive: (id: number) => void 
}) => {
  const navigate = useNavigate();

  const getNotificationIcon = (severity: Notification['severity']) => {
    switch (severity) {
      case 'critical':
        return <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full"><AlertTriangle className="w-5 h-5 text-red-500" /></div>;
      case 'warning':
        return <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-full"><AlertTriangle className="w-5 h-5 text-yellow-500" /></div>;
      default:
        return <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full"><Info className="w-5 h-5 text-blue-500" /></div>;
    }
  };
  
  const getSeverityBadge = (severity: Notification['severity']) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive" className="text-xs">Critical</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Warning</Badge>;
      default:
        return null;
    }
  };

  const handleNotificationClick = () => {
    if (!notification.is_read) {
        onMarkAsRead(notification.id);
    }
    if (notification.data?.budget_id) {
        navigate(`/budgets?budgetId=${notification.data.budget_id}`);
    }
    // Add other navigation logic for different notification types here
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 transition-all duration-200",
        "hover:bg-muted/50",
        !notification.is_read ? "bg-background" : "bg-muted/30 opacity-70"
      )}
    >
      <div className="flex-shrink-0">{getNotificationIcon(notification.severity)}</div>
      <div className="flex-grow cursor-pointer" onClick={handleNotificationClick}>
        <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold">{notification.title}</p>
            {getSeverityBadge(notification.severity)}
        </div>
        <p className="text-sm text-muted-foreground">{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(notification.created_at).toLocaleString()}
        </p>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        className="w-8 h-8 rounded-full flex-shrink-0"
        onClick={(e) => {
            e.stopPropagation(); // Prevent card click event
            onArchive(notification.id);
        }}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

export const NotificationList: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');

  const { data: notifications, isLoading, isError } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(1), // Note: pagination not fully implemented yet
  });

  const filteredNotifications = useMemo(() => {
    if (!notifications) return [];
    return notifications.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              n.message?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSeverity = filterSeverity === 'all' || n.severity === filterSeverity;
        return matchesSearch && matchesSeverity;
    });
  }, [notifications, searchQuery, filterSeverity]);

  const markAsReadMutation = useOptimisticMutation(markNotificationAsRead, ['notifications']);
  const archiveMutation = useOptimisticMutation(archiveNotification, ['notifications']);

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    },
  });
  
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  if (isLoading) {
    return <div>Loading notifications...</div>;
  }

  if (isError) {
    return <div className="text-red-500">Error loading notifications.</div>;
  }

  const unreadCount = notifications?.filter(n => !n.is_read).length ?? 0;

  return (
    <>
        <Card className="mb-6">
            <CardContent className="pt-6">
               <div className="flex flex-col lg:flex-row gap-4">
                 <div className="flex-1">
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input
                       placeholder="Search notifications..."
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className="pl-10"
                     />
                   </div>
                 </div>
                 <div className="flex gap-2">
                   <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                     <SelectTrigger className="w-full sm:w-40">
                       <SelectValue placeholder="Filter by severity" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="all">All Levels</SelectItem>
                       <SelectItem value="critical">Critical</SelectItem>
                       <SelectItem value="warning">Warning</SelectItem>
                       <SelectItem value="info">Info</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
            </CardContent>
        </Card>

        <Card className="shadow-soft">
            <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Inbox</CardTitle>
                        <CardDescription className="mt-1">
                            You have {unreadCount} unread messages.
                        </CardDescription>
                    </div>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} disabled={markAllAsReadMutation.isPending}>
                            <CheckCheck className="w-4 h-4 mr-2" />
                            Mark all as read
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {filteredNotifications && filteredNotifications.length > 0 ? (
                    <div className="divide-y">
                        {filteredNotifications.map((notification) => (
                            <NotificationItem 
                                key={notification.id} 
                                notification={notification} 
                                onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
                                onArchive={(id) => archiveMutation.mutate(id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-12 text-muted-foreground">
                        <Inbox className="w-12 h-12 mx-auto text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium">
                            {searchQuery || filterSeverity !== 'all' ? 'No Matching Notifications' : 'All caught up!'}
                        </h3>
                        <p className="mt-1 text-sm">
                            {searchQuery || filterSeverity !== 'all' ? 'Try adjusting your search or filters.' : 'You have no new notifications.'}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    </>
  );
}; 