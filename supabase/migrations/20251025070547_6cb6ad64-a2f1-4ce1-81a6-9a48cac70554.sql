-- Create a security definer function to check if a user is a manager
-- This bypasses RLS to avoid recursion issues
CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE auth_user_id = _user_id
      AND role = 'manager'
  )
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;

-- Create new policies for managers to manage all users
CREATE POLICY "Managers can view all users"
ON public.users
FOR SELECT
USING (public.is_manager(auth.uid()));

CREATE POLICY "Managers can insert users"
ON public.users
FOR INSERT
WITH CHECK (public.is_manager(auth.uid()));

CREATE POLICY "Managers can update users"
ON public.users
FOR UPDATE
USING (public.is_manager(auth.uid()))
WITH CHECK (public.is_manager(auth.uid()));

CREATE POLICY "Managers can delete users"
ON public.users
FOR DELETE
USING (public.is_manager(auth.uid()));

-- Also update tasks table policies to use the same function
DROP POLICY IF EXISTS "Managers can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Managers can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Managers can update tasks" ON public.tasks;

CREATE POLICY "Managers can view all tasks"
ON public.tasks
FOR SELECT
USING (public.is_manager(auth.uid()));

CREATE POLICY "Managers can insert tasks"
ON public.tasks
FOR INSERT
WITH CHECK (public.is_manager(auth.uid()));

CREATE POLICY "Managers can update tasks"
ON public.tasks
FOR UPDATE
USING (public.is_manager(auth.uid()))
WITH CHECK (public.is_manager(auth.uid()));