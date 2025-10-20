-- Enable public read access to tasks table for the manager dashboard
CREATE POLICY "Allow public read access to tasks"
ON public.tasks
FOR SELECT
TO public
USING (true);

-- Enable public read access to users table for the manager dashboard
CREATE POLICY "Allow public read access to users"
ON public.users
FOR SELECT
TO public
USING (true);

-- Enable public read access to clients table
CREATE POLICY "Allow public read access to clients"
ON public.clients
FOR SELECT
TO public
USING (true);

-- Enable public read access to chats table
CREATE POLICY "Allow public read access to chats"
ON public.chats
FOR SELECT
TO public
USING (true);

-- Enable public read access to new_bot table
CREATE POLICY "Allow public read access to new_bot"
ON public.new_bot
FOR SELECT
TO public
USING (true);