-- Add auth_user_id column to users table to link with auth.users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create unique index on auth_user_id
CREATE UNIQUE INDEX IF NOT EXISTS users_auth_user_id_unique ON public.users(auth_user_id);

-- Drop the user_roles table and related function if they exist
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP FUNCTION IF EXISTS public.has_role(_user_id UUID, _role app_role) CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Update tasks table RLS policies to use users table
DROP POLICY IF EXISTS "Managers can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Managers can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Managers can update tasks" ON public.tasks;

CREATE POLICY "Managers can view all tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'manager'
  )
);

CREATE POLICY "Managers can insert tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'manager'
  )
);

CREATE POLICY "Managers can update tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.auth_user_id = auth.uid()
    AND users.role = 'manager'
  )
);

-- Update users table RLS policies
DROP POLICY IF EXISTS "Managers can view all users" ON public.users;
DROP POLICY IF EXISTS "Managers can insert users" ON public.users;
DROP POLICY IF EXISTS "Managers can delete users" ON public.users;

CREATE POLICY "Managers can view all users"
ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid()
    AND u.role = 'manager'
  )
);

CREATE POLICY "Managers can insert users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid()
    AND u.role = 'manager'
  )
);

CREATE POLICY "Managers can delete users"
ON public.users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid()
    AND u.role = 'manager'
  )
);

CREATE POLICY "Managers can update users"
ON public.users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid()
    AND u.role = 'manager'
  )
);