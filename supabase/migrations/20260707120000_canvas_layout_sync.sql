-- Phase 8: Canvas layout cloud sync (positions, pages, layers, custom elements)

alter table public.resume_workspaces
  add column if not exists canvas_layout jsonb not null default '{}'::jsonb;

create index if not exists resume_workspaces_canvas_layout_updated_idx
  on public.resume_workspaces ((canvas_layout ->> 'updatedAt') desc nulls last);
