-- Create plans table
create table public.plans (
  id text primary key, -- Razorpay Plan ID (e.g., plan_Hw8...)
  name text not null,
  price integer not null, -- Amount in paise
  interval text not null, -- 'monthly' or 'yearly'
  features jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on plans
alter table public.plans enable row level security;

-- Allow read access to all authenticated users
create policy "Allow read access to all users"
  on public.plans for select
  using (true);

-- Create subscriptions table
create table public.subscriptions (
  user_id uuid references auth.users not null primary key,
  razorpay_customer_id text,
  razorpay_subscription_id text unique,
  plan_id text references public.plans(id),
  status text not null, -- 'active', 'created', 'halted', 'cancelled', 'completed', 'expired'
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on subscriptions
alter table public.subscriptions enable row level security;

-- Allow users to view their own subscription
create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Create a function to handle updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for subscriptions
create trigger on_subscriptions_updated
  before update on public.subscriptions
  for each row execute procedure public.handle_updated_at();

-- Insert Default Mock Plans (You should replace IDs with actual Razorpay Plan IDs from your dashboard)
insert into public.plans (id, name, price, interval, features)
values 
  ('plan_mock_monthly', 'Pro Monthly', 49900, 'monthly', '["Unlimited AI Interviews", "Detailed Performance Analysis", "Priority Support", "PDF Reports"]'),
  ('plan_mock_yearly', 'Pro Yearly', 499900, 'yearly', '["Everything in Monthly", "2 Months Free", "Exclusive Guidance", "Early Access to New Features"]');
