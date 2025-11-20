-- Step 1: Add 'client' to the role enum
ALTER TYPE role ADD VALUE IF NOT EXISTS 'client';

-- Add auth_user_id to clients table to link with Supabase Auth
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add unique constraint to ensure one auth user per client
ALTER TABLE public.clients
ADD CONSTRAINT unique_client_auth_user UNIQUE (auth_user_id);

-- Add client_id to tasks table to link tasks with clients
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- RLS Policies for clients table - Clients can view their own record
CREATE POLICY "Clients can view their own record"
ON public.clients
FOR SELECT
USING (auth.uid() = auth_user_id);

-- RLS Policies for tasks table - Clients can view tasks assigned to them
CREATE POLICY "Clients can view their own tasks"
ON public.tasks
FOR SELECT
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
  )
);

-- Create index for better performance on client_id lookups
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON public.tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_auth_user_id ON public.clients(auth_user_id);