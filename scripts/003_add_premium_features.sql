-- Habit categories
create table if not exists public.habit_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  color text not null,
  created_at timestamp with time zone default now()
);

alter table public.habit_categories enable row level security;

create policy "Users can view all categories"
  on public.habit_categories for select
  using (true);

create policy "Users can manage their own categories"
  on public.habit_categories for all
  using (auth.uid() = user_id);

-- Add category, priority, frequency to habits
alter table public.habits 
  add column if not exists category_id uuid references public.habit_categories(id) on delete set null,
  add column if not exists priority text default 'medium',
  add column if not exists frequency text default 'daily',
  add column if not exists target_days integer;

-- Habit notes
create table if not exists public.habit_notes (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  day integer not null,
  note text not null,
  created_at timestamp with time zone default now(),
  unique(habit_id, day)
);

alter table public.habit_notes enable row level security;

create policy "Users can view notes for habits"
  on public.habit_notes for select
  using (
    exists (
      select 1 from public.habits
      where habits.id = habit_notes.habit_id
    )
  );

create policy "Users can manage notes for their habits"
  on public.habit_notes for all
  using (
    exists (
      select 1 from public.habits
      where habits.id = habit_notes.habit_id
      and habits.user_id = auth.uid()
    )
  );

-- Time tracking
create table if not exists public.time_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  day integer not null,
  minutes integer not null,
  created_at timestamp with time zone default now(),
  unique(habit_id, day)
);

alter table public.time_logs enable row level security;

create policy "Users can view all time logs"
  on public.time_logs for select
  using (true);

create policy "Users can manage time logs for their habits"
  on public.time_logs for all
  using (
    exists (
      select 1 from public.habits
      where habits.id = time_logs.habit_id
      and habits.user_id = auth.uid()
    )
  );

-- Achievements
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  habit_id uuid references public.habits(id) on delete cascade,
  type text not null,
  title text not null,
  description text not null,
  icon text not null,
  earned_at timestamp with time zone default now()
);

alter table public.achievements enable row level security;

create policy "Users can view all achievements"
  on public.achievements for select
  using (true);

create policy "Users can insert their own achievements"
  on public.achievements for insert
  with check (auth.uid() = user_id);

-- Comments/Encouragement
create table if not exists public.day_comments (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.users(id) on delete cascade,
  to_user_id uuid not null references public.users(id) on delete cascade,
  month text not null,
  day integer not null,
  comment text not null,
  reaction text,
  created_at timestamp with time zone default now()
);

alter table public.day_comments enable row level security;

create policy "Users can view all comments"
  on public.day_comments for select
  using (true);

create policy "Users can insert comments"
  on public.day_comments for insert
  with check (auth.uid() = from_user_id);

create policy "Users can delete their own comments"
  on public.day_comments for delete
  using (auth.uid() = from_user_id);

-- Shared goals
create table if not exists public.shared_goals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  target_value integer,
  current_value integer default 0,
  completed boolean default false,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

alter table public.shared_goals enable row level security;

create policy "Users can view all shared goals"
  on public.shared_goals for select
  using (true);

create policy "Users can insert shared goals"
  on public.shared_goals for insert
  with check (auth.uid() = created_by);

create policy "Users can update shared goals"
  on public.shared_goals for update
  using (true);

-- Progress photos
create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  habit_id uuid references public.habits(id) on delete cascade,
  date date not null,
  photo_url text not null,
  note text,
  created_at timestamp with time zone default now()
);

alter table public.progress_photos enable row level security;

create policy "Users can view all progress photos"
  on public.progress_photos for select
  using (true);

create policy "Users can manage their own photos"
  on public.progress_photos for all
  using (auth.uid() = user_id);

-- Habit templates
create table if not exists public.habit_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  habits jsonb not null,
  is_public boolean default true,
  created_by uuid references public.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

alter table public.habit_templates enable row level security;

create policy "Users can view public templates"
  on public.habit_templates for select
  using (is_public = true or created_by = auth.uid());

create policy "Users can create templates"
  on public.habit_templates for insert
  with check (auth.uid() = created_by);

-- User preferences
create table if not exists public.user_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  dark_mode boolean default false,
  reminder_enabled boolean default false,
  reminder_time time,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.user_preferences enable row level security;

create policy "Users can view their own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can manage their own preferences"
  on public.user_preferences for all
  using (auth.uid() = user_id);
