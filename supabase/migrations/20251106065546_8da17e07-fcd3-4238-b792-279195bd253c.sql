-- Add RLS policies for employees to view and update their own tasks

-- Allow employees to view their own tasks
CREATE POLICY "Employees can view their own tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = tasks.user_id
    AND users.auth_user_id = auth.uid()
    AND users.role = 'employee'
  )
);

-- Allow employees to update their own tasks
CREATE POLICY "Employees can update their own tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = tasks.user_id
    AND users.auth_user_id = auth.uid()
    AND users.role = 'employee'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = tasks.user_id
    AND users.auth_user_id = auth.uid()
    AND users.role = 'employee'
  )
);

-- Allow employees to view their own user record
CREATE POLICY "Employees can view their own user record"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id AND role = 'employee');