-- Create frequency enum
CREATE TYPE public.task_frequency AS ENUM ('one_time', 'monthly', 'quarterly', 'semi_annually', 'annually');

-- Add frequency column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN frequency public.task_frequency DEFAULT 'one_time';

-- Add INSERT policy for tasks
CREATE POLICY "Allow public insert access to tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (true);

-- Add UPDATE policy for tasks (in case managers need to update task status)
CREATE POLICY "Allow public update access to tasks" 
ON public.tasks 
FOR UPDATE 
USING (true);