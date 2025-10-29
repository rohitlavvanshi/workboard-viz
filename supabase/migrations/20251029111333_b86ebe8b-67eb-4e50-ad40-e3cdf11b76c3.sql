-- Add delete policy for managers on tasks table
CREATE POLICY "Managers can delete tasks"
ON public.tasks
FOR DELETE
USING (is_manager(auth.uid()));