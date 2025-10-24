-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('employee', 'technician', 'manager');

-- Create user_roles table for security
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy: Only authenticated users can read their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS policy: Only managers can view all roles
CREATE POLICY "Managers can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'manager'));

-- Update tasks table RLS policies for authenticated managers only
DROP POLICY IF EXISTS "Allow public read access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public insert access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public update access to tasks" ON public.tasks;

CREATE POLICY "Managers can view all tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can insert tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can update tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'manager'));

-- Update users table RLS policies
DROP POLICY IF EXISTS "Allow public read access to users" ON public.users;
DROP POLICY IF EXISTS "Allow public insert access to users" ON public.users;
DROP POLICY IF EXISTS "Allow public delete access to users" ON public.users;

CREATE POLICY "Managers can view all users"
ON public.users
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can insert users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can delete users"
ON public.users
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'manager'));