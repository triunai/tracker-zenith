import { supabase } from '@/lib/supabase/supabase';
import { Notification } from '@/interfaces/notification-interface';

const NOTIFICATIONS_PER_PAGE = 20;

export const getNotifications = async (page: number = 1) => {
  const { data, error } = await supabase.rpc('get_notifications', {
    p_limit: NOTIFICATIONS_PER_PAGE,
    p_offset: (page - 1) * NOTIFICATIONS_PER_PAGE,
  });

  if (error) {
    console.error('Error fetching notifications:', error);
    throw new Error('Could not fetch notifications');
  }

  return data as Notification[];
};

export const getUnreadNotificationCount = async () => {
  const { data, error } = await supabase.rpc('get_unread_notification_count');

  if (error) {
    console.error('Error fetching unread notification count:', error);
    throw new Error('Could not fetch unread notification count');
  }

  return data;
};

export const markNotificationAsRead = async (notificationId: number) => {
  const { error } = await supabase.rpc('mark_notification_as_read', {
    p_notification_id: notificationId,
  });

  if (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Could not mark notification as read');
  }

  return true;
};

export const markAllNotificationsAsRead = async () => {
  const { error } = await supabase.rpc('mark_all_notifications_as_read');

  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('Could not mark all notifications as read');
  }

  return true;
};

export const archiveNotification = async (notificationId: number) => {
  const { error } = await supabase.rpc('archive_notification', {
    p_notification_id: notificationId,
  });

  if (error) {
    console.error('Error archiving notification:', error);
    throw new Error('Could not archive notification');
  }

  return true;
}; 