-- Fix recursive RLS policies on public.users causing "infinite recursion" errors
-- 1) Drop existing recursive policies
DROP POLICY IF EXISTS "Managers can view all users" ON public.users;
DROP POLICY IF EXISTS "Managers can insert users" ON public.users;
DROP POLICY IF EXISTS "Managers can update users" ON public.users;
DROP POLICY IF EXISTS "Managers can delete users" ON public.users;

-- 2) Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3) Create safe, non-recursive policies that allow users to access only their own row
-- SELECT: Users can view their own profile row
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = auth_user_id);

-- INSERT: Users can insert their own row (e.g., when linking their account)
CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = auth_user_id);

-- UPDATE: Users can update their own row
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- DELETE: Users can delete their own row
CREATE POLICY "Users can delete own profile"
ON public.users
FOR DELETE
USING (auth.uid() = auth_user_id);

-- Notes:
-- - These policies avoid referencing public.users inside policies on public.users, eliminating recursion.
-- - Manager-wide access policies can be added later using a separate mechanism (e.g., edge functions/service role)
--   or a non-recursive pattern if needed.
