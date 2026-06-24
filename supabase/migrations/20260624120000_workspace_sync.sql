-- Phase 24: Resume workspace and application package cloud sync (PostgreSQL via Supabase)

create table if not exists public.resume_workspaces (
  user_id uuid primary key references auth.users (id) on delete cascade,
  resume_data jsonb not null default '{}'::jsonb,
  job_description text not null default '',
  template_id text not null default 'modern-01',
  updated_at timestamptz not null default now()
);

create table if not exists public.user_application_packages (
  user_id uuid primary key references auth.users (id) on delete cascade,
  packages jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.resume_workspaces enable row level security;
alter table public.user_application_packages enable row level security;

create policy "resume_workspaces_select_own"
  on public.resume_workspaces
  for select
  using (auth.uid() = user_id);

create policy "resume_workspaces_insert_own"
  on public.resume_workspaces
  for insert
  with check (auth.uid() = user_id);

create policy "resume_workspaces_update_own"
  on public.resume_workspaces
  for update
  using (auth.uid() = user_id);

create policy "resume_workspaces_delete_own"
  on public.resume_workspaces
  for delete
  using (auth.uid() = user_id);

create policy "user_application_packages_select_own"
  on public.user_application_packages
  for select
  using (auth.uid() = user_id);

create policy "user_application_packages_insert_own"
  on public.user_application_packages
  for insert
  with check (auth.uid() = user_id);

create policy "user_application_packages_update_own"
  on public.user_application_packages
  for update
  using (auth.uid() = user_id);

create policy "user_application_packages_delete_own"
  on public.user_application_packages
  for delete
  using (auth.uid() = user_id);

create index if not exists resume_workspaces_updated_at_idx
  on public.resume_workspaces (updated_at desc);

create index if not exists user_application_packages_updated_at_idx
  on public.user_application_packages (updated_at desc);
