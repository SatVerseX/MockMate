-- Add 'type' column to plans to distinguish between recurring and one-time
alter table public.plans 
add column if not exists type text default 'recurring'; -- 'recurring' or 'one_time'

-- Insert the 1-Day Pass (Manually, since it's not a Razorpay Subscription Plan)
insert into public.plans (id, name, price, interval, features, type)
values 
  ('plan_day_pass_20', 'One Day Pass', 2000, 'daily', '["24-Hour Unlimited Access", "Instant Feedback", "No Subscription Commitment", "PDF Reports"]', 'one_time')
on conflict (id) do update 
set name = excluded.name, price = excluded.price, features = excluded.features, type = excluded.type;
