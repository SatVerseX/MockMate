-- Create interviews table
create table if not exists public.interviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  config jsonb not null default '{}'::jsonb,
  status text not null default 'completed',
  duration integer,
  questions_asked integer not null default 0,
  warning_count integer not null default 0,
  overall_score integer,
  metrics jsonb,
  feedback jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create interview_transcripts table
create table if not exists public.interview_transcripts (
  id uuid default gen_random_uuid() primary key,
  interview_id uuid references public.interviews(id) on delete cascade not null,
  entries jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.interviews enable row level security;
alter table public.interview_transcripts enable row level security;

-- Users can view their own interviews
create policy "Users can view own interviews"
  on public.interviews for select
  using (auth.uid() = user_id);

-- Users can insert their own interviews
create policy "Users can insert own interviews"
  on public.interviews for insert
  with check (auth.uid() = user_id);

-- Users can delete their own interviews
create policy "Users can delete own interviews"
  on public.interviews for delete
  using (auth.uid() = user_id);

-- Users can view transcripts of their own interviews
create policy "Users can view own transcripts"
  on public.interview_transcripts for select
  using (
    exists (
      select 1 from public.interviews
      where interviews.id = interview_transcripts.interview_id
      and interviews.user_id = auth.uid()
    )
  );

-- Users can insert transcripts for their own interviews
create policy "Users can insert own transcripts"
  on public.interview_transcripts for insert
  with check (
    exists (
      select 1 from public.interviews
      where interviews.id = interview_transcripts.interview_id
      and interviews.user_id = auth.uid()
    )
  );

-- Create index for faster queries
create index if not exists idx_interviews_user_id on public.interviews(user_id);
create index if not exists idx_interviews_created_at on public.interviews(created_at desc);
create index if not exists idx_interview_transcripts_interview_id on public.interview_transcripts(interview_id);
