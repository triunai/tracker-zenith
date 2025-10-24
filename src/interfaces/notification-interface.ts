export type Notification = {
  id: number;
  user_id: string;
  type: 'budget_alert' | 'report_ready' | 'anomaly_detected' | 'new_feature';
  title: string;
  message: string | null;
  data: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
  severity: 'info' | 'warning' | 'critical';
}; 