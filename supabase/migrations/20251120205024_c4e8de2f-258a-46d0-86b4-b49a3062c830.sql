-- Allow clients to view their own user record
CREATE POLICY "Clients can view their own user record"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id AND role = 'client');