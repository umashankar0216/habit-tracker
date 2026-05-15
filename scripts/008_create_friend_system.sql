-- Create friend_requests table for friend connections
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone default now(),
  responded_at timestamp with time zone,
  unique(sender_id, receiver_id)
);

alter table public.friend_requests enable row level security;

-- Users can view their own sent and received friend requests
create policy "Users can view their friend requests"
  on public.friend_requests for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Users can send friend requests to others
create policy "Users can send friend requests"
  on public.friend_requests for insert
  with check (auth.uid() = sender_id and sender_id != receiver_id);

-- Receivers can accept/reject their requests
create policy "Users can respond to friend requests"
  on public.friend_requests for update
  using (auth.uid() = receiver_id);

-- Users can delete rejected requests
create policy "Users can delete friend requests"
  on public.friend_requests for delete
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Create view for mutual friends
create or replace view public.mutual_friends as
select 
  case 
    when f.sender_id = auth.uid() then f.receiver_id 
    else f.sender_id 
  end as friend_id
from public.friend_requests f
where f.status = 'accepted' 
  and (f.sender_id = auth.uid() or f.receiver_id = auth.uid());

-- Drop and recreate users columns for friend system
alter table public.users drop column if exists active_group_id;
