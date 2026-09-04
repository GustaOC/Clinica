-- Apply once using the Supabase SQL editor / migration CLI.
-- No patient, procedure, product, credential or demo data is inserted.
begin;

create table public.aesthetic_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'doctor' check (role in ('admin', 'doctor')),
  active boolean not null default true
);
create function public.aesthetic_is_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.aesthetic_members where user_id = auth.uid() and active);
$$;
create function public.aesthetic_is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.aesthetic_members where user_id = auth.uid() and active and role = 'admin');
$$;
revoke all on function public.aesthetic_is_member(), public.aesthetic_is_admin() from public, anon;
grant execute on function public.aesthetic_is_member(), public.aesthetic_is_admin() to authenticated;
alter table public.aesthetic_members enable row level security;
create policy "Member can read own permission" on public.aesthetic_members for select to authenticated using (user_id = auth.uid());
revoke all on public.aesthetic_members from anon, authenticated;
grant select on public.aesthetic_members to authenticated;

create table public.aesthetic_procedures (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 120),
  description text not null default '',
  regions text[] not null check (cardinality(regions) between 1 and 20),
  questions jsonb not null default '[]' check (jsonb_typeof(questions) = 'array'),
  requires_product boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.aesthetic_products (
  id uuid primary key default gen_random_uuid(),
  procedure_id uuid not null references public.aesthetic_procedures(id),
  name text not null check (char_length(name) between 1 and 120),
  brand text not null default '',
  unit text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (procedure_id, name, brand)
);
alter table public.aesthetic_procedures enable row level security;
alter table public.aesthetic_products enable row level security;
create policy "Members read procedures" on public.aesthetic_procedures for select to authenticated using (public.aesthetic_is_member());
create policy "Admins create procedures" on public.aesthetic_procedures for insert to authenticated with check (public.aesthetic_is_admin());
create policy "Admins update procedures" on public.aesthetic_procedures for update to authenticated using (public.aesthetic_is_admin()) with check (public.aesthetic_is_admin());
create policy "Members read products" on public.aesthetic_products for select to authenticated using (public.aesthetic_is_member());
create policy "Admins create products" on public.aesthetic_products for insert to authenticated with check (public.aesthetic_is_admin());
create policy "Admins update products" on public.aesthetic_products for update to authenticated using (public.aesthetic_is_admin()) with check (public.aesthetic_is_admin());
revoke all on public.aesthetic_procedures, public.aesthetic_products from anon, authenticated;
grant select, insert, update on public.aesthetic_procedures, public.aesthetic_products to authenticated;

create table public.aesthetic_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  title text not null check (char_length(title) between 1 and 100),
  plan jsonb not null check (jsonb_typeof(plan) = 'object'),
  consent boolean not null check (consent = true),
  consent_at timestamptz not null,
  created_at timestamptz not null default now()
);
create table public.aesthetic_photos (
  id uuid primary key,
  session_id uuid not null references public.aesthetic_sessions(id),
  owner_id uuid not null references auth.users(id),
  label text not null,
  original_path text not null unique,
  generated_path text,
  status text not null default 'uploaded' check (status in ('uploaded','processing','completed','failed')),
  error text,
  claim_token uuid,
  started_at timestamptz,
  attempts integer not null default 0,
  model text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  check (original_path = owner_id::text || '/' || session_id::text || '/' || id::text || '-original.jpg')
);
create index aesthetic_sessions_owner_created on public.aesthetic_sessions(owner_id, created_at desc);
create index aesthetic_photos_owner_status on public.aesthetic_photos(owner_id, status);
create index aesthetic_photos_session on public.aesthetic_photos(session_id);
alter table public.aesthetic_sessions enable row level security;
alter table public.aesthetic_photos enable row level security;
create policy "Owner reads sessions" on public.aesthetic_sessions for select to authenticated using (owner_id = auth.uid() and public.aesthetic_is_member());
create policy "Owner creates sessions" on public.aesthetic_sessions for insert to authenticated with check (owner_id = auth.uid() and public.aesthetic_is_member());
create policy "Owner reads photos" on public.aesthetic_photos for select to authenticated using (owner_id = auth.uid() and public.aesthetic_is_member());
create policy "Owner creates photos" on public.aesthetic_photos for insert to authenticated with check (
  owner_id = auth.uid() and public.aesthetic_is_member() and status = 'uploaded' and generated_path is null and claim_token is null and attempts = 0
  and exists (select 1 from public.aesthetic_sessions s where s.id = session_id and s.owner_id = auth.uid())
);
revoke all on public.aesthetic_sessions, public.aesthetic_photos from anon, authenticated;
grant select, insert on public.aesthetic_sessions, public.aesthetic_photos to authenticated;

-- Atomic claims prevent a double click from generating/billing the same photo twice.
-- Each approved account can have at most two active generations. No batch photo count limit.
create function public.claim_aesthetic_photo(photo_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare p public.aesthetic_photos; running integer;
begin
  if not public.aesthetic_is_member() then raise exception 'Access denied'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  select * into p from public.aesthetic_photos where id = photo_id and owner_id = auth.uid() for update;
  if not found then return null; end if;
  if p.status = 'completed' then return null; end if;
  if p.status = 'processing' and p.started_at > now() - interval '10 minutes' then raise exception 'Already processing'; end if;
  select count(*) into running from public.aesthetic_photos where owner_id = auth.uid() and status = 'processing' and started_at > now() - interval '10 minutes';
  if running >= 2 then raise exception 'Concurrency limit'; end if;
  update public.aesthetic_photos set status = 'processing', started_at = now(), claim_token = gen_random_uuid(), error = null, attempts = attempts + 1
    where id = photo_id returning * into p;
  return to_jsonb(p);
end;
$$;
create function public.finish_aesthetic_photo(photo_id uuid, token uuid, result_path text, failure_message text, used_model text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare p public.aesthetic_photos;
begin
  if not public.aesthetic_is_member() then raise exception 'Access denied'; end if;
  select * into p from public.aesthetic_photos where id = photo_id and owner_id = auth.uid() and claim_token = token and status = 'processing' for update;
  if not found then raise exception 'Claim expired'; end if;
  if result_path is not null and result_path <> (p.owner_id::text || '/' || p.session_id::text || '/' || p.id::text || '-generated-' || token::text || '.jpg') then raise exception 'Invalid path'; end if;
  update public.aesthetic_photos set status = case when result_path is null then 'failed' else 'completed' end,
    generated_path = result_path, error = left(failure_message, 400), model = left(used_model, 100), completed_at = now()
    where id = photo_id returning * into p;
  return to_jsonb(p);
end;
$$;
revoke all on function public.claim_aesthetic_photo(uuid), public.finish_aesthetic_photo(uuid,uuid,text,text,text) from public, anon;
grant execute on function public.claim_aesthetic_photo(uuid), public.finish_aesthetic_photo(uuid,uuid,text,text,text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('aesthetic-photos', 'aesthetic-photos', false, 5242880, array['image/jpeg']) on conflict (id) do nothing;
do $$ begin
  if exists (select 1 from storage.buckets where id = 'aesthetic-photos' and public = true) then raise exception 'aesthetic-photos must be private'; end if;
end $$;
create policy "Members upload own aesthetic photos" on storage.objects for insert to authenticated with check (bucket_id = 'aesthetic-photos' and (storage.foldername(name))[1] = auth.uid()::text and public.aesthetic_is_member());
create policy "Members read own aesthetic photos" on storage.objects for select to authenticated using (bucket_id = 'aesthetic-photos' and (storage.foldername(name))[1] = auth.uid()::text and public.aesthetic_is_member());
create policy "Members remove own aesthetic photos" on storage.objects for delete to authenticated using (bucket_id = 'aesthetic-photos' and (storage.foldername(name))[1] = auth.uid()::text and public.aesthetic_is_member());
commit;
