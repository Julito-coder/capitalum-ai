import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export type NotificationType = 'info' | 'warning' | 'success' | 'critical';
export type NotificationCategory = 'fiscal' | 'epargne' | 'immobilier' | 'professionnel' | 'general';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  data: Json;
  is_read: boolean;
  is_dismissed: boolean;
  priority: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationInput {
  type?: NotificationType;
  category?: NotificationCategory;
  title: string;
  message: string;
  data?: Json;
  priority?: number;
  expires_at?: string;
}

/**
 * Fetch all active notifications for the current user
 */
export const fetchNotifications = async (): Promise<Notification[]> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.user.id)
    .eq('is_dismissed', false)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return (data || []) as Notification[];
};

/**
 * Fetch unread notifications count
 */
export const fetchUnreadCount = async (): Promise<number> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.user.id)
    .eq('is_read', false)
    .eq('is_dismissed', false);

  if (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }

  return count || 0;
};

/**
 * Create a new notification
 */
export const createNotification = async (input: CreateNotificationInput): Promise<Notification | null> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;

  const insertData = {
    user_id: user.user.id,
    type: input.type || 'info',
    category: input.category || 'general',
    title: input.title,
    message: input.message,
    data: input.data || {},
    priority: input.priority || 0,
    expires_at: input.expires_at || null,
  };

  const { data, error } = await supabase
    .from('notifications')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }

  return data as Notification;
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (notificationId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }

  return true;
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<boolean> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return false;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.user.id)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }

  return true;
};

/**
 * Dismiss a notification (soft delete)
 */
export const dismissNotification = async (notificationId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_dismissed: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error dismissing notification:', error);
    return false;
  }

  return true;
};

/**
 * Delete a notification permanently
 */
export const deleteNotification = async (notificationId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error('Error deleting notification:', error);
    return false;
  }

  return true;
};

/**
 * Generate dashboard alerts as notifications
 * Call this when user profile changes or on dashboard load
 */
export const syncDashboardAlerts = async (alerts: Array<{
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'success' | 'info';
  gain?: number;
  deadline?: string;
}>): Promise<void> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  // Fetch existing notifications to avoid duplicates
  const { data: existing } = await supabase
    .from('notifications')
    .select('data')
    .eq('user_id', user.user.id)
    .eq('is_dismissed', false);

  const existingAlertIds = new Set(
    (existing || []).map((n) => {
      const data = n.data as Record<string, unknown> | null;
      return data?.alert_id;
    }).filter(Boolean)
  );

  // Create notifications for new alerts
  for (const alert of alerts) {
    if (existingAlertIds.has(alert.id)) continue;

    await createNotification({
      type: alert.severity,
      category: getCategoryFromAlertType(alert.type),
      title: alert.title,
      message: alert.message,
      priority: alert.severity === 'critical' ? 10 : alert.severity === 'warning' ? 5 : 0,
      data: {
        alert_id: alert.id,
        gain: alert.gain,
        deadline: alert.deadline,
      },
      expires_at: alert.deadline,
    });
  }
};

const getCategoryFromAlertType = (type: string): NotificationCategory => {
  if (type.includes('fiscal') || type.includes('tax') || type.includes('ir')) return 'fiscal';
  if (type.includes('epargne') || type.includes('pea') || type.includes('per')) return 'epargne';
  if (type.includes('immo') || type.includes('foncier')) return 'immobilier';
  if (type.includes('urssaf') || type.includes('tva')) return 'professionnel';
  return 'general';
};
