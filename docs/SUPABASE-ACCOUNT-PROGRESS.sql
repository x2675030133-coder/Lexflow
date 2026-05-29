create table if not exists public.account_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  snapshot jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.account_progress enable row level security;

drop policy if exists "Users can read own account progress" on public.account_progress;
create policy "Users can read own account progress"
on public.account_progress
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own account progress" on public.account_progress;
create policy "Users can insert own account progress"
on public.account_progress
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own account progress" on public.account_progress;
create policy "Users can update own account progress"
on public.account_progress
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists account_progress_updated_at_idx
on public.account_progress (updated_at desc);
