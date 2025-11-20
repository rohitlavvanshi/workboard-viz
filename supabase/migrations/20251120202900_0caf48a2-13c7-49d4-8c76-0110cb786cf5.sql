-- Create security definer function to check if user is a client
CREATE OR REPLACE FUNCTION public.is_client(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE auth_user_id = _user_id
      AND role = 'client'
  )
$$;