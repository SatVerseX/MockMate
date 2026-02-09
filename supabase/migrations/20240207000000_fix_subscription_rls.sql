-- Add INSERT and UPDATE policies to subscriptions table
-- This allows users to create and update their own subscription records

-- Allow users to insert their own subscription
create policy "Users can insert own subscription"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

-- Allow users to update their own subscription
create policy "Users can update own subscription"
  on public.subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Note: The edge function uses the user's auth token, so these policies
-- will allow the function to insert/update subscription records for the 
-- authenticated user.
