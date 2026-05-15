-- Users table (extends auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default now()
);

alter table public.users enable row level security;

create policy "Users can view all users"
  on public.users for select
  using (true);

create policy "Users can insert their own data"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Users can update their own data"
  on public.users for update
  using (auth.uid() = id);

-- Habits table
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  month text not null, -- Format: "YYYY-MM"
  created_at timestamp with time zone default now()
);

alter table public.habits enable row level security;

create policy "Users can view all habits"
  on public.habits for select
  using (true);

create policy "Users can insert their own habits"
  on public.habits for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own habits"
  on public.habits for update
  using (auth.uid() = user_id);

create policy "Users can delete their own habits"
  on public.habits for delete
  using (auth.uid() = user_id);

-- Habit completions table
create table if not exists public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  day integer not null, -- 1-31
  completed boolean default false,
  created_at timestamp with time zone default now(),
  unique(habit_id, day)
);

alter table public.habit_completions enable row level security;

create policy "Users can view all habit completions"
  on public.habit_completions for select
  using (true);

create policy "Users can manage completions for their habits"
  on public.habit_completions for all
  using (
    exists (
      select 1 from public.habits
      where habits.id = habit_completions.habit_id
      and habits.user_id = auth.uid()
    )
  );

-- Sleep tracking table
create table if not exists public.sleep_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  month text not null, -- Format: "YYYY-MM"
  day integer not null, -- 1-31
  hours integer not null, -- 5, 6, 7, 8, or 9
  created_at timestamp with time zone default now(),
  unique(user_id, month, day)
);

alter table public.sleep_tracking enable row level security;

create policy "Users can view all sleep tracking"
  on public.sleep_tracking for select
  using (true);

create policy "Users can insert their own sleep data"
  on public.sleep_tracking for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sleep data"
  on public.sleep_tracking for update
  using (auth.uid() = user_id);

create policy "Users can delete their own sleep data"
  on public.sleep_tracking for delete
  using (auth.uid() = user_id);

-- Personal goals table
create table if not exists public.personal_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  text text not null,
  completed boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.personal_goals enable row level security;

create policy "Users can view their own goals"
  on public.personal_goals for select
  using (auth.uid() = user_id);

create policy "Users can insert their own goals"
  on public.personal_goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own goals"
  on public.personal_goals for update
  using (auth.uid() = user_id);

create policy "Users can delete their own goals"
  on public.personal_goals for delete
  using (auth.uid() = user_id);

-- Daily journals table
create table if not exists public.daily_journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  mood text,
  note text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, date)
);

alter table public.daily_journals enable row level security;

create policy "Users can view their own journals"
  on public.daily_journals for select
  using (auth.uid() = user_id);

create policy "Users can insert their own journals"
  on public.daily_journals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own journals"
  on public.daily_journals for update
  using (auth.uid() = user_id);

create policy "Users can delete their own journals"
  on public.daily_journals for delete
  using (auth.uid() = user_id);
