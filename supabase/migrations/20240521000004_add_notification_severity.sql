-- 1. Create the ENUM type for notification severity
CREATE TYPE public.notification_severity_enum AS ENUM
(
    'info',
    'warning',
    'critical'
);

-- 2. Add the severity column to the notifications table
ALTER TABLE public.notifications
ADD COLUMN severity public.notification_severity_enum NOT NULL DEFAULT 'info';

-- 3. Add a comment for clarity
COMMENT ON COLUMN public.notifications.severity IS 'The severity level of the notification (e.g., info, warning, critical).'; 