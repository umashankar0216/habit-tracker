-- Add privacy and admin features to users table
alter table public.users add column if not exists is_private boolean default false;
alter table public.users add column if not exists is_admin boolean default false;

-- Update RLS policies for habits to respect privacy settings
drop policy if exists "Users can view all habits" on public.habits;

create policy "Users can view habits based on privacy"
  on public.habits for select
  using (
    -- User can see their own habits
    auth.uid() = user_id
    -- OR user is an admin
    or exists (select 1 from public.users where id = auth.uid() and is_admin = true)
    -- OR the habit owner's profile is public
    or exists (select 1 from public.users where id = habits.user_id and is_private = false)
  );

-- Update RLS policies for sleep tracking to respect privacy settings
drop policy if exists "Users can view all sleep tracking" on public.sleep_tracking;

create policy "Users can view sleep tracking based on privacy"
  on public.sleep_tracking for select
  using (
    -- User can see their own sleep data
    auth.uid() = user_id
    -- OR user is an admin
    or exists (select 1 from public.users where id = auth.uid() and is_admin = true)
    -- OR the owner's profile is public
    or exists (select 1 from public.users where id = sleep_tracking.user_id and is_private = false)
  );

-- Update achievements visibility
drop policy if exists "Users can view all achievements" on public.achievements;

create policy "Users can view achievements based on privacy"
  on public.achievements for select
  using (
    -- User can see their own achievements
    auth.uid() = user_id
    -- OR user is an admin
    or exists (select 1 from public.users where id = auth.uid() and is_admin = true)
    -- OR the owner's profile is public
    or exists (select 1 from public.users where id = achievements.user_id and is_private = false)
  );

-- Update habit notes visibility
drop policy if exists "Users can view all habit notes" on public.habit_notes;

create policy "Users can view habit notes based on privacy"
  on public.habit_notes for select
  using (
    -- User can see their own notes
    auth.uid() = user_id
    -- OR user is an admin
    or exists (select 1 from public.users where id = auth.uid() and is_admin = true)
    -- OR the owner's profile is public
    or exists (select 1 from public.users where id = habit_notes.user_id and is_private = false)
  );

-- Create function to make the first user an admin
create or replace function public.make_first_user_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_count integer;
begin
  select count(*) into user_count from public.users;
  
  -- If this is the first user, make them admin
  if user_count = 1 then
    update public.users set is_admin = true where id = new.id;
  end if;
  
  return new;
end;
$$;

drop trigger if exists make_first_user_admin_trigger on public.users;

create trigger make_first_user_admin_trigger
  after insert on public.users
  for each row
  execute function public.make_first_user_admin();
