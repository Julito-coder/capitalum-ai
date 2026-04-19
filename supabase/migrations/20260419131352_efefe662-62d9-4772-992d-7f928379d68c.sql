-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule weekly proactive agent run (Mondays at 8h UTC)
SELECT cron.schedule(
  'elio-agent-weekly-proactive',
  '0 8 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://ejqtavzyyzpbathmbhbv.supabase.co/functions/v1/elio-agent-proactive',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6Ik9HanFrcGFOMVRTUEJpMTciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2VqcXRhdnp5eXpwYmF0aG1iaGJ2LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJzZXJ2aWNlX3JvbGUiLCJhdWQiOiJzZXJ2aWNlX3JvbGUiLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MTc2ODI1MTA4NSwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImFhbCI6ImFhbDEiLCJzZXNzaW9uX2lkIjoiY3JvbiJ9.placeholder',
      'X-Cron-Source', 'pg_cron'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);