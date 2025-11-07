-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  client_type TEXT,
  services_provided TEXT,
  service_start_date DATE,
  assigned_employee_id BIGINT REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only managers can access clients
CREATE POLICY "Managers can view all clients"
ON public.clients
FOR SELECT
USING (is_manager(auth.uid()));

CREATE POLICY "Managers can insert clients"
ON public.clients
FOR INSERT
WITH CHECK (is_manager(auth.uid()));

CREATE POLICY "Managers can update clients"
ON public.clients
FOR UPDATE
USING (is_manager(auth.uid()))
WITH CHECK (is_manager(auth.uid()));

CREATE POLICY "Managers can delete clients"
ON public.clients
FOR DELETE
USING (is_manager(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_projects_updated_at();