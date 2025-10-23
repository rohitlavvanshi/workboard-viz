-- Add DELETE policy for users table
CREATE POLICY "Allow public delete access to users"
ON public.users
FOR DELETE
USING (true);