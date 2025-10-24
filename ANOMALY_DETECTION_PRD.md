# 🚨 **Anomaly Detection System PRD**
## **Product Requirements Document v1.1**
ANOMALYANOMALY
---

## 📋 **Executive Summary**

Building an intelligent **relational anomaly detection system** for Tracker Zenith that identifies unusual spending patterns, budget overruns, and financial anomalies using existing PostgreSQL infrastructure. This system will provide real-time alerts through the existing toast notification system and integrate seamlessly with the current React Query + Supabase architecture.

**Target Cost**: $10/month for 10-20 users  
**Implementation Timeline**: 3 days  
**Architecture**: Pure relational database with existing RPC patterns

---

## ✅ **IMPLEMENTATION STATUS - Updated Dec 2024**

### **🎉 COMPLETED FEATURES**

#### **1. Document Processing System** ✅
- **AI-Powered Document Upload**: Complete document upload with AI processing
- **Beautiful UI Components**: DocumentUploader and ProcessedDocuments with glassmorphic design
- **Real-time Processing**: Edge function integration for OCR and data extraction
- **Transaction Creation**: Seamless conversion from documents to transactions
- **Status Tracking**: Upload → Processing → Ready → Transaction Created workflow

#### **2. Toast Notification System** ✅
- **Custom Toast Framework**: Built comprehensive `toast-notifications.tsx` system
- **7 Toast Types**: success, error, warning, info, ai, document, transaction, remove
- **Beautiful Styling**: Purple glowing borders matching app aesthetic
- **Dark Mode Support**: Perfect contrast in both light and dark themes
- **Predefined Functions**: Ready-to-use toast functions for all common actions
- **Performance Optimized**: Lightweight Sonner implementation (~15KB bundle impact)

#### **3. UI/UX Enhancements** ✅
- **Cleaned Document Cards**: Removed crowded badges, improved spacing
- **Better Information Hierarchy**: Vendor name, amount, date properly organized
- **Remove Functionality**: Users can remove documents from processing list
- **Responsive Design**: Works perfectly on all screen sizes
- **Consistent Styling**: All components follow design system

#### **4. Technical Infrastructure** ✅
- **Proper Interface Usage**: Using `@/interfaces/document-interface.ts` correctly
- **State Management**: Clean document state handling in React
- **Error Handling**: Comprehensive error states and user feedback
- **Type Safety**: Full TypeScript implementation
- **Code Organization**: Modular, reusable components

### **🚧 IN PROGRESS**
- **SQL RPC Functions**: Ready to implement tomorrow (database layer)
- **Alert System Backend**: Database schema and stored procedures
- **Notification Integration**: Connect alerts to toast system

### **📋 NEXT PHASE - SQL IMPLEMENTATION**
- **Database Schema**: user_alert_preferences, alert_history tables
- **RPC Functions**: Amount anomaly detection, budget alerts, merchant detection
- **Integration**: Connect backend alerts to frontend toast system
- **Testing**: Comprehensive alert testing and validation  

---

## 🎯 **Product Goals**

### **Primary Objectives**
1. **Catch overspending immediately** - Alert users when they exceed normal spending patterns
2. **Budget protection** - Warn when approaching or exceeding budget limits  
3. **Pattern recognition** - Identify unusual merchant, category, or timing patterns
4. **Zero infrastructure overhead** - Use existing Supabase + PostgreSQL setup

### **Success Metrics**
- **User Engagement**: 40% increase in budget adherence
- **Financial Awareness**: 60% reduction in surprise overspending
- **System Performance**: <200ms alert generation time
- **Cost Efficiency**: Stay within $10/month operational cost

### **✅ ACHIEVED MILESTONES**
- **Document Processing**: 100% functional AI-powered document upload system
- **Toast Notifications**: Beautiful, performant notification system with purple aesthetic
- **UI/UX Polish**: Clean, responsive interface with proper dark mode support
- **Technical Foundation**: Solid TypeScript architecture ready for SQL integration

---

## 🏗️ **Technical Architecture**

### **Database Schema Extensions**

#### **1. User Alert Preferences Table**
```sql
CREATE TABLE public.user_alert_preferences (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  
  -- Anomaly Detection Settings
  amount_anomaly_enabled boolean DEFAULT true,
  amount_sigma_threshold numeric(3,1) DEFAULT 2.0, -- 2.0 = 2 standard deviations
  
  -- Budget Alert Settings  
  budget_alert_enabled boolean DEFAULT true,
  budget_warning_threshold numeric(3,2) DEFAULT 0.80, -- 80% of budget
  budget_critical_threshold numeric(3,2) DEFAULT 0.95, -- 95% of budget
  
  -- Pattern Detection Settings
  new_merchant_alert_enabled boolean DEFAULT true,
  frequency_anomaly_enabled boolean DEFAULT true,
  category_drift_enabled boolean DEFAULT false,
  
  -- Notification Preferences
  notification_method text DEFAULT 'toast', -- 'toast', 'email', 'both'
  quiet_hours_start time DEFAULT '22:00',
  quiet_hours_end time DEFAULT '08:00',
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  isdeleted boolean DEFAULT false
);
```

#### **2. Alert History Table**
```sql
CREATE TABLE public.alert_history (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  alert_type text NOT NULL, -- 'amount_anomaly', 'budget_warning', 'new_merchant', etc.
  severity text NOT NULL, -- 'info', 'warning', 'critical'
  
  -- Alert Context
  expense_id bigint REFERENCES expense(id),
  category_id bigint REFERENCES expense_category(id),
  budget_id bigint REFERENCES budget(id),
  
  -- Alert Data
  title text NOT NULL,
  message text NOT NULL,
  alert_data jsonb, -- Flexible data storage for alert specifics
  
  -- Status Tracking
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  dismissed_at timestamp,
  
  created_at timestamp DEFAULT now(),
  isdeleted boolean DEFAULT false
);

-- Indexes for performance
CREATE INDEX idx_alert_history_user_unread ON alert_history(user_id, is_read) WHERE isdeleted = false;
CREATE INDEX idx_alert_history_created_at ON alert_history(created_at DESC);
```

---

## 🔧 **Core RPC Functions**

### **1. Amount Anomaly Detection**
```sql
CREATE OR REPLACE FUNCTION detect_amount_anomalies(
  p_user_id UUID,
  p_expense_id BIGINT DEFAULT NULL, -- If null, check all recent expenses
  p_days_lookback INTEGER DEFAULT 90,
  p_sigma_threshold NUMERIC DEFAULT 2.0
)
RETURNS TABLE(
  expense_id BIGINT,
  category_name TEXT,
  amount NUMERIC,
  expected_avg NUMERIC,
  deviation_score NUMERIC,
  severity TEXT,
  alert_message TEXT
) AS $$
DECLARE
  v_preferences RECORD;
BEGIN
  -- Get user preferences
  SELECT * INTO v_preferences 
  FROM user_alert_preferences 
  WHERE user_id = p_user_id AND isdeleted = false;
  
  -- Use default if no preferences found
  IF v_preferences IS NULL THEN
    v_preferences.amount_sigma_threshold := p_sigma_threshold;
    v_preferences.amount_anomaly_enabled := true;
  END IF;
  
  -- Skip if disabled
  IF NOT v_preferences.amount_anomaly_enabled THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH category_stats AS (
    SELECT 
      ec.id as category_id,
      ec.name as category_name,
      AVG(ei.amount) as avg_amount,
      STDDEV(ei.amount) as stddev_amount,
      COUNT(*) as transaction_count
    FROM expense_category ec
    JOIN expense_item ei ON ec.id = ei.category_id
    JOIN expense e ON ei.expense_id = e.id
    WHERE e.user_id = p_user_id
      AND e.isdeleted = false
      AND ei.isdeleted = false
      AND e.date >= (CURRENT_DATE - INTERVAL '1 day' * p_days_lookback)
      AND (e.transaction_type = 'expense' OR e.transaction_type IS NULL)
    GROUP BY ec.id, ec.name
    HAVING COUNT(*) >= 3 -- Need at least 3 transactions for meaningful stats
  ),
  recent_expenses AS (
    SELECT 
      e.id as expense_id,
      ei.category_id,
      ei.amount,
      e.date
    FROM expense e
    JOIN expense_item ei ON e.id = ei.expense_id
    WHERE e.user_id = p_user_id
      AND e.isdeleted = false
      AND ei.isdeleted = false
      AND (p_expense_id IS NULL OR e.id = p_expense_id)
      AND e.date >= (CURRENT_DATE - INTERVAL '7 days') -- Check last week
      AND (e.transaction_type = 'expense' OR e.transaction_type IS NULL)
  )
  SELECT 
    re.expense_id,
    cs.category_name,
    re.amount,
    cs.avg_amount as expected_avg,
    CASE 
      WHEN cs.stddev_amount > 0 THEN 
        ABS(re.amount - cs.avg_amount) / cs.stddev_amount
      ELSE 0
    END as deviation_score,
    CASE 
      WHEN cs.stddev_amount > 0 AND ABS(re.amount - cs.avg_amount) / cs.stddev_amount >= 3.0 THEN 'critical'
      WHEN cs.stddev_amount > 0 AND ABS(re.amount - cs.avg_amount) / cs.stddev_amount >= v_preferences.amount_sigma_threshold THEN 'warning'
      ELSE 'info'
    END as severity,
    CASE 
      WHEN re.amount > cs.avg_amount THEN
        format('💸 High spending alert! $%.2f in %s (%.1fx your average of $%.2f)', 
               re.amount, cs.category_name, 
               re.amount / NULLIF(cs.avg_amount, 0), cs.avg_amount)
      ELSE
        format('💰 Unusually low spending: $%.2f in %s (%.1fx below average of $%.2f)', 
               re.amount, cs.category_name,
               cs.avg_amount / NULLIF(re.amount, 0), cs.avg_amount)
    END as alert_message
  FROM recent_expenses re
  JOIN category_stats cs ON re.category_id = cs.category_id
  WHERE cs.stddev_amount > 0 
    AND ABS(re.amount - cs.avg_amount) / cs.stddev_amount >= v_preferences.amount_sigma_threshold
  ORDER BY deviation_score DESC;
END;
$$ LANGUAGE plpgsql;
```

### **2. Budget Alert Detection**
```sql
CREATE OR REPLACE FUNCTION detect_budget_alerts(
  p_user_id UUID,
  p_budget_id BIGINT DEFAULT NULL
)
RETURNS TABLE(
  budget_id BIGINT,
  budget_name TEXT,
  total_budget NUMERIC,
  spent_amount NUMERIC,
  percentage_used NUMERIC,
  severity TEXT,
  alert_message TEXT,
  days_remaining INTEGER
) AS $$
DECLARE
  v_preferences RECORD;
BEGIN
  -- Get user preferences
  SELECT * INTO v_preferences 
  FROM user_alert_preferences 
  WHERE user_id = p_user_id AND isdeleted = false;
  
  -- Use defaults if no preferences
  IF v_preferences IS NULL THEN
    v_preferences.budget_warning_threshold := 0.80;
    v_preferences.budget_critical_threshold := 0.95;
    v_preferences.budget_alert_enabled := true;
  END IF;
  
  -- Skip if disabled
  IF NOT v_preferences.budget_alert_enabled THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH budget_spending AS (
    SELECT 
      b.id as budget_id,
      b.name as budget_name,
      b.amount as total_budget,
      b.period,
      b.start_date,
      b.end_date,
      COALESCE(calculate_budget_spending(b.id), 0) as spent_amount,
      CASE 
        WHEN b.end_date IS NOT NULL THEN 
          GREATEST(0, (b.end_date - CURRENT_DATE))
        WHEN b.period = 'monthly' THEN 
          GREATEST(0, (date_trunc('month', CURRENT_DATE) + interval '1 month' - CURRENT_DATE))
        WHEN b.period = 'weekly' THEN 
          GREATEST(0, (date_trunc('week', CURRENT_DATE) + interval '1 week' - CURRENT_DATE))
        ELSE 30 -- Default fallback
      END as days_remaining
    FROM budget b
    WHERE b.user_id = p_user_id
      AND b.isdeleted = false
      AND (p_budget_id IS NULL OR b.id = p_budget_id)
  )
  SELECT 
    bs.budget_id,
    bs.budget_name,
    bs.total_budget,
    bs.spent_amount,
    ROUND((bs.spent_amount / NULLIF(bs.total_budget, 0)) * 100, 1) as percentage_used,
    CASE 
      WHEN bs.spent_amount >= bs.total_budget THEN 'critical'
      WHEN bs.spent_amount >= (bs.total_budget * v_preferences.budget_critical_threshold) THEN 'critical'
      WHEN bs.spent_amount >= (bs.total_budget * v_preferences.budget_warning_threshold) THEN 'warning'
      ELSE 'info'
    END as severity,
    CASE 
      WHEN bs.spent_amount >= bs.total_budget THEN
        format('🚨 Budget exceeded! %s: $%.2f over budget ($%.2f spent of $%.2f)', 
               bs.budget_name, bs.spent_amount - bs.total_budget, bs.spent_amount, bs.total_budget)
      WHEN bs.spent_amount >= (bs.total_budget * v_preferences.budget_critical_threshold) THEN
        format('⚠️ Budget critical! %s: %.1f%% used ($%.2f of $%.2f) with %d days left', 
               bs.budget_name, (bs.spent_amount / bs.total_budget) * 100, 
               bs.spent_amount, bs.total_budget, bs.days_remaining)
      ELSE
        format('💡 Budget warning: %s: %.1f%% used ($%.2f of $%.2f)', 
               bs.budget_name, (bs.spent_amount / bs.total_budget) * 100, 
               bs.spent_amount, bs.total_budget)
    END as alert_message,
    bs.days_remaining::INTEGER
  FROM budget_spending bs
  WHERE bs.spent_amount >= (bs.total_budget * v_preferences.budget_warning_threshold)
  ORDER BY (bs.spent_amount / NULLIF(bs.total_budget, 0)) DESC;
END;
$$ LANGUAGE plpgsql;
```

### **3. New Merchant Detection**
```sql
CREATE OR REPLACE FUNCTION detect_new_merchants(
  p_user_id UUID,
  p_days_lookback INTEGER DEFAULT 7
)
RETURNS TABLE(
  expense_id BIGINT,
  merchant_name TEXT,
  amount NUMERIC,
  category_name TEXT,
  transaction_date TIMESTAMP,
  alert_message TEXT
) AS $$
DECLARE
  v_preferences RECORD;
BEGIN
  -- Get user preferences
  SELECT * INTO v_preferences 
  FROM user_alert_preferences 
  WHERE user_id = p_user_id AND isdeleted = false;
  
  -- Skip if disabled
  IF v_preferences IS NULL OR NOT v_preferences.new_merchant_alert_enabled THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH historical_merchants AS (
    SELECT DISTINCT 
      LOWER(TRIM(e.description)) as merchant_name
    FROM expense e
    WHERE e.user_id = p_user_id
      AND e.isdeleted = false
      AND e.description IS NOT NULL
      AND e.date < (CURRENT_DATE - INTERVAL '1 day' * p_days_lookback)
  ),
  recent_expenses AS (
    SELECT 
      e.id as expense_id,
      LOWER(TRIM(e.description)) as merchant_name,
      e.description as original_description,
      ei.amount,
      ec.name as category_name,
      e.date as transaction_date
    FROM expense e
    JOIN expense_item ei ON e.id = ei.expense_id
    LEFT JOIN expense_category ec ON ei.category_id = ec.id
    WHERE e.user_id = p_user_id
      AND e.isdeleted = false
      AND ei.isdeleted = false
      AND e.description IS NOT NULL
      AND e.date >= (CURRENT_DATE - INTERVAL '1 day' * p_days_lookback)
      AND (e.transaction_type = 'expense' OR e.transaction_type IS NULL)
  )
  SELECT 
    re.expense_id,
    re.original_description as merchant_name,
    re.amount,
    COALESCE(re.category_name, 'Uncategorized') as category_name,
    re.transaction_date,
    format('🏪 New merchant detected: "%s" - $%.2f in %s', 
           re.original_description, re.amount, 
           COALESCE(re.category_name, 'Uncategorized')) as alert_message
  FROM recent_expenses re
  LEFT JOIN historical_merchants hm ON re.merchant_name = hm.merchant_name
  WHERE hm.merchant_name IS NULL -- Not found in historical data
    AND LENGTH(re.merchant_name) > 3 -- Avoid very short descriptions
  ORDER BY re.transaction_date DESC;
END;
$$ LANGUAGE plpgsql;
```

### **4. Master Alert Generation Function**
```sql
CREATE OR REPLACE FUNCTION generate_user_alerts(
  p_user_id UUID,
  p_save_to_history BOOLEAN DEFAULT true
)
RETURNS TABLE(
  alert_type TEXT,
  severity TEXT,
  title TEXT,
  message TEXT,
  alert_data JSONB
) AS $$
DECLARE
  v_alert RECORD;
  v_alert_id BIGINT;
BEGIN
  -- Amount Anomalies
  FOR v_alert IN 
    SELECT 'amount_anomaly' as alert_type, severity, 
           'Unusual Spending Detected' as title, alert_message as message,
           jsonb_build_object(
             'expense_id', expense_id,
             'category_name', category_name,
             'amount', amount,
             'expected_avg', expected_avg,
             'deviation_score', deviation_score
           ) as alert_data
    FROM detect_amount_anomalies(p_user_id)
  LOOP
    -- Save to history if requested
    IF p_save_to_history THEN
      INSERT INTO alert_history (user_id, alert_type, severity, title, message, alert_data, expense_id)
      VALUES (p_user_id, v_alert.alert_type, v_alert.severity, v_alert.title, v_alert.message, v_alert.alert_data, (v_alert.alert_data->>'expense_id')::BIGINT)
      RETURNING id INTO v_alert_id;
    END IF;
    
    RETURN NEXT;
  END LOOP;

  -- Budget Alerts  
  FOR v_alert IN 
    SELECT 'budget_alert' as alert_type, severity,
           'Budget Alert' as title, alert_message as message,
           jsonb_build_object(
             'budget_id', budget_id,
             'budget_name', budget_name,
             'percentage_used', percentage_used,
             'spent_amount', spent_amount,
             'total_budget', total_budget,
             'days_remaining', days_remaining
           ) as alert_data
    FROM detect_budget_alerts(p_user_id)
  LOOP
    IF p_save_to_history THEN
      INSERT INTO alert_history (user_id, alert_type, severity, title, message, alert_data, budget_id)
      VALUES (p_user_id, v_alert.alert_type, v_alert.severity, v_alert.title, v_alert.message, v_alert.alert_data, (v_alert.alert_data->>'budget_id')::BIGINT)
      RETURNING id INTO v_alert_id;
    END IF;
    
    RETURN NEXT;
  END LOOP;

  -- New Merchant Alerts
  FOR v_alert IN 
    SELECT 'new_merchant' as alert_type, 'info' as severity,
           'New Merchant' as title, alert_message as message,
           jsonb_build_object(
             'expense_id', expense_id,
             'merchant_name', merchant_name,
             'amount', amount,
             'category_name', category_name
           ) as alert_data
    FROM detect_new_merchants(p_user_id)
  LOOP
    IF p_save_to_history THEN
      INSERT INTO alert_history (user_id, alert_type, severity, title, message, alert_data, expense_id)
      VALUES (p_user_id, v_alert.alert_type, v_alert.severity, v_alert.title, v_alert.message, v_alert.alert_data, (v_alert.alert_data->>'expense_id')::BIGINT)
      RETURNING id INTO v_alert_id;
    END IF;
    
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

---

## 🎨 **Frontend Integration**

### **1. Alert API Layer**
```typescript
// src/lib/api/alertApi.ts
import { supabase } from '../supabase/supabase';

export interface Alert {
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  alert_data: Record<string, any>;
}

export interface AlertHistory {
  id: number;
  user_id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  alert_data: Record<string, any>;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

export interface UserAlertPreferences {
  id?: number;
  user_id: string;
  amount_anomaly_enabled: boolean;
  amount_sigma_threshold: number;
  budget_alert_enabled: boolean;
  budget_warning_threshold: number;
  budget_critical_threshold: number;
  new_merchant_alert_enabled: boolean;
  frequency_anomaly_enabled: boolean;
  notification_method: 'toast' | 'email' | 'both';
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export const alertApi = {
  // Generate alerts for current user
  generateAlerts: async (userId: string, saveToHistory: boolean = true): Promise<Alert[]> => {
    const { data, error } = await supabase.rpc('generate_user_alerts', {
      p_user_id: userId,
      p_save_to_history: saveToHistory
    });
    
    if (error) throw error;
    return data || [];
  },

  // Get alert history
  getAlertHistory: async (userId: string, limit: number = 50): Promise<AlertHistory[]> => {
    const { data, error } = await supabase
      .from('alert_history')
      .select('*')
      .eq('user_id', userId)
      .eq('isdeleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  // Mark alerts as read
  markAsRead: async (alertIds: number[]): Promise<void> => {
    const { error } = await supabase
      .from('alert_history')
      .update({ is_read: true })
      .in('id', alertIds);
    
    if (error) throw error;
  },

  // Dismiss alerts
  dismissAlerts: async (alertIds: number[]): Promise<void> => {
    const { error } = await supabase
      .from('alert_history')
      .update({ 
        is_dismissed: true, 
        dismissed_at: new Date().toISOString() 
      })
      .in('id', alertIds);
    
    if (error) throw error;
  },

  // Get user preferences
  getPreferences: async (userId: string): Promise<UserAlertPreferences | null> => {
    const { data, error } = await supabase
      .from('user_alert_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('isdeleted', false)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  },

  // Update user preferences
  updatePreferences: async (preferences: UserAlertPreferences): Promise<UserAlertPreferences> => {
    const { data, error } = await supabase
      .from('user_alert_preferences')
      .upsert({
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
```

### **2. Alert Hook**
```typescript
// src/hooks/useAlerts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { alertApi, Alert, AlertHistory } from '@/lib/api/alertApi';
import { useToast } from '@/components/ui/use-toast';

export const useAlerts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate and show alerts
  const { data: currentAlerts = [], refetch: checkAlerts } = useQuery({
    queryKey: ['alerts', 'current', user?.id],
    queryFn: () => user ? alertApi.generateAlerts(user.id, true) : [],
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
    refetchOnWindowFocus: true,
  });

  // Get alert history
  const { data: alertHistory = [] } = useQuery({
    queryKey: ['alerts', 'history', user?.id],
    queryFn: () => user ? alertApi.getAlertHistory(user.id) : [],
    enabled: !!user,
  });

  // Show toast notifications for new alerts
  React.useEffect(() => {
    currentAlerts.forEach((alert: Alert) => {
      const variant = alert.severity === 'critical' ? 'destructive' : 
                    alert.severity === 'warning' ? 'default' : 'default';
      
      toast({
        title: alert.title,
        description: alert.message,
        variant,
        duration: alert.severity === 'critical' ? 10000 : 5000,
      });
    });
  }, [currentAlerts, toast]);

  // Mark alerts as read
  const markAsReadMutation = useMutation({
    mutationFn: alertApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', 'history'] });
    },
  });

  return {
    currentAlerts,
    alertHistory,
    checkAlerts,
    markAsRead: markAsReadMutation.mutate,
    unreadCount: alertHistory.filter(alert => !alert.is_read).length,
  };
};
```

### **3. Alert Settings Component**
```typescript
// src/components/Settings/AlertSettings.tsx
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { alertApi, UserAlertPreferences } from '@/lib/api/alertApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export const AlertSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['alertPreferences', user?.id],
    queryFn: () => user ? alertApi.getPreferences(user.id) : null,
    enabled: !!user,
  });

  const [settings, setSettings] = React.useState<Partial<UserAlertPreferences>>({
    amount_anomaly_enabled: true,
    amount_sigma_threshold: 2.0,
    budget_alert_enabled: true,
    budget_warning_threshold: 0.80,
    budget_critical_threshold: 0.95,
    new_merchant_alert_enabled: true,
    notification_method: 'toast',
  });

  React.useEffect(() => {
    if (preferences) {
      setSettings(preferences);
    }
  }, [preferences]);

  const updatePreferencesMutation = useMutation({
    mutationFn: (newPreferences: UserAlertPreferences) => 
      alertApi.updatePreferences(newPreferences),
    onSuccess: () => {
      toast({
        title: 'Settings Updated',
        description: 'Your alert preferences have been saved.',
      });
      queryClient.invalidateQueries({ queryKey: ['alertPreferences'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update alert preferences.',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    if (!user) return;
    
    updatePreferencesMutation.mutate({
      ...settings,
      user_id: user.id,
    } as UserAlertPreferences);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🚨 Anomaly Detection</CardTitle>
          <CardDescription>
            Get alerted when your spending patterns are unusual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="amount-anomaly">Amount Anomaly Detection</Label>
            <Switch
              id="amount-anomaly"
              checked={settings.amount_anomaly_enabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, amount_anomaly_enabled: checked }))
              }
            />
          </div>
          
          {settings.amount_anomaly_enabled && (
            <div className="space-y-2">
              <Label>Sensitivity (Standard Deviations)</Label>
              <Slider
                value={[settings.amount_sigma_threshold || 2.0]}
                onValueChange={([value]) => 
                  setSettings(prev => ({ ...prev, amount_sigma_threshold: value }))
                }
                min={1.0}
                max={3.0}
                step={0.1}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                {settings.amount_sigma_threshold}σ - {
                  (settings.amount_sigma_threshold || 2.0) < 1.5 ? 'Very Sensitive' :
                  (settings.amount_sigma_threshold || 2.0) < 2.0 ? 'Sensitive' :
                  (settings.amount_sigma_threshold || 2.0) < 2.5 ? 'Balanced' : 'Conservative'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>💰 Budget Alerts</CardTitle>
          <CardDescription>
            Stay on track with your budget goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="budget-alerts">Budget Alerts</Label>
            <Switch
              id="budget-alerts"
              checked={settings.budget_alert_enabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, budget_alert_enabled: checked }))
              }
            />
          </div>
          
          {settings.budget_alert_enabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Warning Threshold</Label>
                <Slider
                  value={[(settings.budget_warning_threshold || 0.8) * 100]}
                  onValueChange={([value]) => 
                    setSettings(prev => ({ ...prev, budget_warning_threshold: value / 100 }))
                  }
                  min={50}
                  max={95}
                  step={5}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Alert when {Math.round((settings.budget_warning_threshold || 0.8) * 100)}% of budget is used
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Critical Threshold</Label>
                <Slider
                  value={[(settings.budget_critical_threshold || 0.95) * 100]}
                  onValueChange={([value]) => 
                    setSettings(prev => ({ ...prev, budget_critical_threshold: value / 100 }))
                  }
                  min={80}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Critical alert when {Math.round((settings.budget_critical_threshold || 0.95) * 100)}% of budget is used
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🏪 Pattern Detection</CardTitle>
          <CardDescription>
            Detect new merchants and unusual patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="new-merchant">New Merchant Alerts</Label>
            <Switch
              id="new-merchant"
              checked={settings.new_merchant_alert_enabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, new_merchant_alert_enabled: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full">
        Save Alert Settings
      </Button>
    </div>
  );
};
```

---

## 🔄 **Integration Points**

### **1. Transaction Creation Hook**
```typescript
// Modify existing useTransactionForm.tsx
const createTransactionMutation = useMutation({
  mutationFn: expenseApi.create,
  onSuccess: (data) => {
    // Existing success logic...
    
    // Check for alerts after creating transaction
    if (user) {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['alerts', 'current', user.id] });
      }, 1000); // Small delay to ensure transaction is processed
    }
  },
});
```

### **2. Dashboard Integration**
```typescript
// Add to src/components/Dashboard/DashboardSummary.tsx
import { useAlerts } from '@/hooks/useAlerts';

export const DashboardSummary = () => {
  const { unreadCount } = useAlerts();
  
  // Add alert indicator to dashboard
  return (
    <div className="dashboard-summary">
      {unreadCount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                {unreadCount} new alert{unreadCount > 1 ? 's' : ''}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Existing dashboard content */}
    </div>
  );
};
```

---

## 📊 **Cost Analysis**

### **Supabase Usage Breakdown**
- **Database Storage**: ~10MB additional (alert history + preferences) = **$0.10/month**
- **Database Compute**: ~1000 RPC calls/day = **$0.50/month**  
- **Real-time subscriptions**: Not needed for this implementation = **$0**
- **Edge Functions**: Not needed = **$0**

### **Total Monthly Cost**: **$0.60/month** 
**Well under the $10 budget!** 🎉

---

## 🚀 **Implementation Timeline**

### **Day 1: Database Setup**
- [ ] Create alert tables and indexes
- [ ] Implement core RPC functions
- [ ] Test anomaly detection algorithms
- [ ] Seed user preferences with defaults

### **Day 2: Frontend Integration**  
- [ ] Build alertApi layer
- [ ] Create useAlerts hook
- [ ] Integrate with existing toast system
- [ ] Add alert indicators to dashboard

### **Day 3: Settings & Polish**
- [ ] Build AlertSettings component
- [ ] Add alert history view
- [ ] Test end-to-end flow
- [ ] Performance optimization

---

## 🎯 **Success Criteria**

### **Technical Requirements**
- ✅ Alert generation < 200ms response time
- ✅ Zero false positives on budget alerts
- ✅ 95% accuracy on amount anomaly detection
- ✅ Seamless integration with existing UI patterns

### **User Experience**
- ✅ Non-intrusive notifications that don't overwhelm
- ✅ Clear, actionable alert messages
- ✅ Easy-to-understand settings interface
- ✅ Immediate feedback on spending behavior

### **Business Impact**
- ✅ Increased user engagement with budgeting features
- ✅ Reduced surprise overspending incidents
- ✅ Enhanced financial awareness and control
- ✅ Foundation for future AI-powered features

---

## 🔮 **Future Enhancements**

### **Phase 2 Possibilities**
1. **Email/SMS Notifications** - Extend beyond toast notifications
2. **Seasonal Pattern Detection** - Holiday spending, tax season, etc.
3. **Merchant Category Intelligence** - Auto-categorize based on patterns
4. **Predictive Budgeting** - Forecast budget overruns before they happen
5. **Social Comparison** - Anonymous benchmarking against similar users

### **Integration with Semantic Search (Future)**
Once vector search is implemented, these relational alerts can be enhanced with:
- **Contextual Anomalies**: "This restaurant spending is unusual for a Tuesday"
- **Semantic Merchant Matching**: Group similar merchants automatically
- **Natural Language Queries**: "Show me alerts about my coffee spending"

---

**Ready to build this intelligent financial guardian for your users! 🦁**