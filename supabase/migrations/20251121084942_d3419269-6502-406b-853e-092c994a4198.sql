-- Add new array column for multiple employee assignments
ALTER TABLE public.clients 
ADD COLUMN assigned_employee_ids BIGINT[];

-- Migrate existing single employee assignment to array
UPDATE public.clients 
SET assigned_employee_ids = ARRAY[assigned_employee_id]
WHERE assigned_employee_id IS NOT NULL;

-- Drop the old single employee column
ALTER TABLE public.clients 
DROP COLUMN assigned_employee_id;