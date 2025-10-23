-- Enable public insert access to users table for creating new employees
CREATE POLICY "Allow public insert access to users"
ON public.users
FOR INSERT
TO public
WITH CHECK (true);