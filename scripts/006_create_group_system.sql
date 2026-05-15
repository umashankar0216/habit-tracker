-- Create groups table
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  leader_id uuid not null references public.users(id) on delete cascade,
  password text,
  created_at timestamp with time zone default now()
);

alter table public.groups enable row level security;

-- Anyone can view groups (to see which ones exist)
create policy "Anyone can view groups"
  on public.groups for select
  using (true);

-- Users can create groups
create policy "Users can create groups"
  on public.groups for insert
  with check (auth.uid() = leader_id);

-- Group leaders can update their groups
create policy "Group leaders can update groups"
  on public.groups for update
  using (auth.uid() = leader_id);

-- Group leaders can delete their groups
create policy "Group leaders can delete groups"
  on public.groups for delete
  using (auth.uid() = leader_id);

-- Create group members table
create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamp with time zone default now(),
  unique(group_id, user_id)
);

alter table public.group_members enable row level security;

-- Users can view group members of groups they're in
create policy "Users can view group members"
  on public.group_members for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
    )
  );

-- Group leaders can add members
create policy "Group leaders can add members"
  on public.group_members for insert
  with check (
    exists (
      select 1 from public.groups
      where groups.id = group_members.group_id
      and groups.leader_id = auth.uid()
    )
  );

-- Group leaders can remove members
create policy "Group leaders can remove members"
  on public.group_members for delete
  using (
    exists (
      select 1 from public.groups
      where groups.id = group_members.group_id
      and groups.leader_id = auth.uid()
    )
  );

-- Create group join requests table
create table if not exists public.group_join_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamp with time zone default now(),
  reviewed_at timestamp with time zone,
  unique(group_id, user_id)
);

alter table public.group_join_requests enable row level security;

-- Users can view their own requests
create policy "Users can view their own join requests"
  on public.group_join_requests for select
  using (auth.uid() = user_id);

-- Users can create join requests
create policy "Users can create join requests"
  on public.group_join_requests for insert
  with check (auth.uid() = user_id);

-- Group leaders can view requests for their groups
create policy "Group leaders can view join requests"
  on public.group_join_requests for select
  using (
    exists (
      select 1 from public.groups
      where groups.id = group_join_requests.group_id
      and groups.leader_id = auth.uid()
    )
  );

-- Group leaders can update requests (approve/reject)
create policy "Group leaders can update join requests"
  on public.group_join_requests for update
  using (
    exists (
      select 1 from public.groups
      where groups.id = group_join_requests.group_id
      and groups.leader_id = auth.uid()
    )
  );

-- Add active_group_id to users table
alter table public.users add column if not exists active_group_id uuid references public.groups(id);

-- Update RLS policies for habits to use groups
drop policy if exists "Users can view habits based on privacy" on public.habits;
drop policy if exists "Users can view all habits" on public.habits;

create policy "Users can view habits in their group"
  on public.habits for select
  using (
    exists (
      select 1 from public.users u1
      join public.group_members gm1 on gm1.user_id = u1.id
      join public.group_members gm2 on gm2.group_id = gm1.group_id
      join public.users u2 on u2.id = gm2.user_id
      where u1.id = auth.uid()
      and u2.id = habits.user_id
    )
  );

-- Update RLS policies for sleep tracking to use groups
drop policy if exists "Users can view sleep tracking based on privacy" on public.sleep_tracking;
drop policy if exists "Users can view all sleep tracking" on public.sleep_tracking;

create policy "Users can view sleep tracking in their group"
  on public.sleep_tracking for select
  using (
    exists (
      select 1 from public.users u1
      join public.group_members gm1 on gm1.user_id = u1.id
      join public.group_members gm2 on gm2.group_id = gm1.group_id
      join public.users u2 on u2.id = gm2.user_id
      where u1.id = auth.uid()
      and u2.id = sleep_tracking.user_id
    )
  );
