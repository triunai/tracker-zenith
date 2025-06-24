-- 1. RPC to get a paginated list of notifications for the current user
CREATE OR REPLACE FUNCTION get_notifications
(p_limit INT, p_offset INT)
RETURNS TABLE
(
  id BIGINT,
  user_id UUID,
  type public.notification_type_enum,
  title VARCHAR
(255),
  message TEXT,
  data JSONB,
  is_read BOOLEAN,
  created_at TIMESTAMP
WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.id,
        n.user_id,
        n.type,
        n.title,
        n.message,
        n.data,
        n.is_read,
        n.created_at
    FROM public.notifications n
    WHERE n.user_id = auth.uid() AND n.is_archived = false
    ORDER BY n.created_at DESC
  LIMIT p_limit
  OFFSET
    p_offset;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY INVOKER;

-- 2. RPC to get the number of unread notifications for the current user
CREATE OR REPLACE FUNCTION get_unread_notification_count
()
RETURNS INT AS $$
DECLARE
  unread_count INT;
BEGIN
    SELECT count(*)
    INTO unread_count
    FROM public.notifications
    WHERE user_id = auth.uid() AND is_read = false AND is_archived = false;

    RETURN unread_count;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY INVOKER;

-- 3. RPC to mark a single notification as read
CREATE OR REPLACE FUNCTION mark_notification_as_read
(p_notification_id BIGINT)
RETURNS void AS $$
BEGIN
    UPDATE public.notifications
  SET is_read = true
  WHERE id = p_notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY INVOKER;

-- 4. RPC to mark all notifications as read for the current user
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read
()
RETURNS void AS $$
BEGIN
    UPDATE public.notifications
  SET is_read = true
  WHERE user_id = auth.uid() AND is_read = false;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY INVOKER; 