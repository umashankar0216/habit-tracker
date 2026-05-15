-- Create privacy requests table
create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamp with time zone default now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid references public.users(id),
  reason text,
  unique(user_id)
);

alter table public.privacy_requests enable row level security;

-- Users can view their own requests
create policy "Users can view their own privacy requests"
  on public.privacy_requests for select
  using (auth.uid() = user_id);

-- Users can insert their own privacy requests
create policy "Users can insert their own privacy requests"
  on public.privacy_requests for insert
  with check (auth.uid() = user_id);

-- Admins can view all requests
create policy "Admins can view all privacy requests"
  on public.privacy_requests for select
  using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- Admins can update all requests
create policy "Admins can update all privacy requests"
  on public.privacy_requests for update
  using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- Add approved_for_privacy column to users table
alter table public.users add column if not exists approved_for_privacy boolean default false;
