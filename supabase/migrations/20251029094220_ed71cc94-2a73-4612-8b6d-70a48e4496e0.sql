-- Add scheduled_day column to tasks table
-- This stores which day of the month (1-31) a recurring task should be created
ALTER TABLE public.tasks
ADD COLUMN scheduled_day integer;

-- Add a check constraint to ensure the day is between 1 and 31
ALTER TABLE public.tasks
ADD CONSTRAINT scheduled_day_valid CHECK (scheduled_day >= 1 AND scheduled_day <= 31);