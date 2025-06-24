-- 1. Create the ENUM type for notification types
CREATE TYPE public.notification_type_enum AS ENUM (
    'budget_alert',
    'report_ready',
    'anomaly_detected',
    'new_feature'
);

-- 2. Create the notifications table
CREATE TABLE public.notifications (
  id bigserial NOT NULL,
  user_id uuid NOT NULL,
  type public.notification_type_enum NOT NULL,
  title character varying(255) NOT NULL,
  message text NULL,
  data jsonb NULL, -- To store related data like budget_id or transaction_id
  is_read boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- 3. Add comments to the table and columns for clarity
COMMENT ON TABLE public.notifications IS 'Stores notifications for users about various system events.';
COMMENT ON COLUMN public.notifications.user_id IS 'The user who receives the notification.';
COMMENT ON COLUMN public.notifications.type IS 'The type of notification (e.g., budget alert, report ready).';
COMMENT ON COLUMN public.notifications.data IS 'JSONB object to store context-specific data, e.g., { "budget_id": 123 }.';
COMMENT ON COLUMN public.notifications.is_read IS 'Indicates if the user has read the notification.';
COMMENT ON COLUMN public.notifications.is_archived IS 'Indicates if the notification is archived (for performance).';

-- 4. Enable Row-Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
-- Policy: Users can only view their own notifications
CREATE POLICY "Enable read access for users based on user_id"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (e.g., mark as read)
CREATE POLICY "Enable update access for users based on user_id"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Note: Inserting notifications should be handled by trusted backend functions (SECURITY DEFINER),
-- so we don't need an INSERT policy for users. This prevents users from creating fake notifications. 