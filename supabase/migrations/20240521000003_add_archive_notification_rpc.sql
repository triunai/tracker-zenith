-- RPC to archive a single notification
CREATE OR REPLACE FUNCTION archive_notification
(p_notification_id BIGINT)
RETURNS void AS $$
BEGIN
    -- Use the existing RLS policy by calling with SECURITY INVOKER
    UPDATE public.notifications
  SET is_archived = true
  WHERE id = p_notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY INVOKER; 