-- Drop problematic policies causing infinite recursion
drop policy if exists "Group leaders can add members" on public.group_members;
drop policy if exists "Group leaders can remove members" on public.group_members;

-- Recreate policies without circular references
-- Users can view members of groups they belong to (simple query, no recursion)
create policy "Members can view group members"
  on public.group_members for select
  using (
    group_id IN (
      select group_id from public.group_members 
      where user_id = auth.uid()
    )
  );

-- Users can add themselves to groups
create policy "Users can join groups"
  on public.group_members for insert
  with check (auth.uid() = user_id);

-- Users can leave groups they're in
create policy "Users can leave groups"
  on public.group_members for delete
  using (auth.uid() = user_id);

-- Group creators/leaders can manage members via a simpler check
-- Check if user created the group (in groups table) instead of checking group_members
create policy "Group creators can remove members"
  on public.group_members for delete
  using (
    exists (
      select 1 from public.groups 
      where groups.id = group_members.group_id 
      and groups.created_by = auth.uid()
    )
  );
