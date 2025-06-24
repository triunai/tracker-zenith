-- Check if the spending percentage exceeds the user-defined alert threshold
IF spending_percentage >= budget_record.alert_threshold THEN

-- CORRECTED: Check if an identical, unread notification for this specific budget category already exists.
SELECT EXISTS
(
    SELECT 1
FROM public.notifications n
WHERE n.user_id = budget_record.user_id
  AND n.type = 'budget_alert'
  AND n.is_read = false
  AND (n.data->>'budget_id')
::bigint = budget_record.id
      AND
(n.data->>'category_id')::bigint = budget_record.category_id
  ) INTO notification_exists;

-- If no similar notification exists, create a new one.
IF NOT notification_exists THEN
INSERT INTO public.notifications
  (user_id, type, title, message, data, severity)
VALUES
  (
    budget_record.user_id,
    'budget_alert',
    'Budget Alert: ' || budget_record.budget_name,
    'Spending on your "' || budget_record.budget_name || '" budget has reached ' || round(spending_percentage, 2) || '%.',
    jsonb_build_object(
        'budget_id', budget_record.id,
        'budget_name', budget_record.budget_name,
        'category_id', budget_record.category_id,
        'category_name', budget_record.category_name,
        'current_spending', current_spending,
        'budget_amount', budget_record.budget_amount,
        'spending_percentage', round(spending_percentage, 2)
    ),
    CASE
      WHEN spending_percentage >= 100 THEN 'critical'::public.notification_severity_enum
      ELSE 'warning'
::public.notification_severity_enum
END
  );
END
IF;
END
IF; 