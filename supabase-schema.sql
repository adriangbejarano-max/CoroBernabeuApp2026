create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null default '',
  role text not null check (role in ('admin', 'volunteer')),
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_date date not null,
  location text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.attendees (
  id uuid primary key default gen_random_uuid(),
  dni text not null default '',
  full_name text not null,
  category text not null default 'Cantante',
  group_name text not null default '',
  email text not null default '',
  birth_date date,
  accreditation text not null default '',
  source text not null default 'manual' check (source in ('manual', 'excel')),
  phone text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.attendees add column if not exists email text not null default '';
alter table public.attendees add column if not exists birth_date date;
alter table public.attendees add column if not exists accreditation text not null default '';
alter table public.attendees add column if not exists source text not null default 'manual';

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  attendee_id uuid not null references public.attendees(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  checked_by uuid references auth.users(id) on delete set null,
  checked_in_at timestamptz not null default now(),
  unique(attendee_id, event_id)
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.attendees enable row level security;
alter table public.checkins enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin"
on public.profiles for insert
to authenticated
with check (public.is_admin());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin"
on public.profiles for delete
to authenticated
using (public.is_admin());

drop policy if exists "events_select_authenticated" on public.events;
create policy "events_select_authenticated"
on public.events for select
to authenticated
using (true);

drop policy if exists "events_write_admin" on public.events;
create policy "events_write_admin"
on public.events for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "attendees_select_authenticated" on public.attendees;
create policy "attendees_select_authenticated"
on public.attendees for select
to authenticated
using (true);

drop policy if exists "attendees_write_admin" on public.attendees;
create policy "attendees_write_admin"
on public.attendees for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "checkins_select_authenticated" on public.checkins;
create policy "checkins_select_authenticated"
on public.checkins for select
to authenticated
using (true);

drop policy if exists "checkins_insert_authenticated" on public.checkins;
create policy "checkins_insert_authenticated"
on public.checkins for insert
to authenticated
with check (checked_by = auth.uid());

drop policy if exists "checkins_delete_authenticated" on public.checkins;
create policy "checkins_delete_authenticated"
on public.checkins for delete
to authenticated
using (true);

insert into public.events (id, name, event_date, location)
values
  ('00000000-0000-4000-8000-000000000001', 'Encuentro Coral Santiago Bernabeu', '2026-06-14', 'Estadio Santiago Bernabeu'),
  ('00000000-0000-4000-8000-000000000002', 'Ensayo general', '2026-06-12', 'Zona de escenario'),
  ('00000000-0000-4000-8000-000000000003', 'Acreditaciones previas', '2026-06-11', 'Acceso principal')
on conflict (id) do nothing;

delete from public.attendees
where id in (
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000102',
  '00000000-0000-4000-8000-000000000103',
  '00000000-0000-4000-8000-000000000104',
  '00000000-0000-4000-8000-000000000105',
  '00000000-0000-4000-8000-000000000106',
  '00000000-0000-4000-8000-000000000107'
);
