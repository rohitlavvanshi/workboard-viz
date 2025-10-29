-- Add 'daily' to task_frequency enum
ALTER TYPE task_frequency ADD VALUE IF NOT EXISTS 'daily';

-- Add new columns to tasks table for scheduling automation
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS parent_task_id BIGINT REFERENCES public.tasks(id) ON DELETE SET NULL;

-- Add index for efficient querying of template tasks
CREATE INDEX IF NOT EXISTS idx_tasks_next_scheduled 
ON public.tasks(next_scheduled_at) 
WHERE is_template = true;

-- Add index for parent task lookups
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id 
ON public.tasks(parent_task_id) 
WHERE parent_task_id IS NOT NULL;

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the create-scheduled-tasks function to run daily at midnight
SELECT cron.schedule(
  'create-scheduled-tasks-daily',
  '0 0 * * *', -- Run at midnight UTC daily
  $$
  SELECT net.http_post(
    url:='https://afnctctxrprpnysndgtc.supabase.co/functions/v1/create-scheduled-tasks',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmbmN0Y3R4cnBycG55c25kZ3RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NTY1NjcsImV4cCI6MjA2NzEzMjU2N30.hx6cJXyd1qDsYDRJhRm0z-vkhtdlP-aOgrIqXqgqW38"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);