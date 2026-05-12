create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  batch_name text not null,
  created_at timestamptz not null default now(),
  status text not null default 'draft' check (status in ('draft', 'uploading', 'uploaded', 'enhanced', 'metadata_ready', 'exported'))
);

create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  original_filename text not null,
  stored_url text not null,
  enhanced_url text,
  width integer,
  height integer,
  file_size bigint,
  status text not null default 'pending' check (status in ('pending', 'uploaded', 'enhancing', 'enhanced', 'metadata_ready', 'rejected', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.metadata (
  id uuid primary key default gen_random_uuid(),
  image_id uuid not null unique references public.images(id) on delete cascade,
  title text not null,
  description text not null,
  keywords text[] not null default '{}',
  category text not null,
  license_type_suggestion text not null default 'auto' check (license_type_suggestion in ('commercial', 'editorial', 'auto')),
  release_warning text,
  quality_warning text,
  ai_confidence_score numeric(3, 2),
  user_edited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  default_export_platforms text[] not null default array['master', 'adobe', 'shutterstock'],
  default_keyword_count integer not null default 50 check (default_keyword_count in (30, 50)),
  default_license_preference text not null default 'auto' check (default_license_preference in ('commercial', 'editorial', 'auto')),
  include_scientific_names boolean not null default true,
  strict_quality_warnings boolean not null default true,
  beginner_mode_explanations boolean not null default true,
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do update set email = excluded.email;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.users enable row level security;
alter table public.batches enable row level security;
alter table public.images enable row level security;
alter table public.metadata enable row level security;
alter table public.user_settings enable row level security;

create policy "Users can read own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can manage own settings" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own batches" on public.batches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage images in own batches" on public.images
  for all using (
    exists (
      select 1 from public.batches
      where batches.id = images.batch_id
      and batches.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.batches
      where batches.id = images.batch_id
      and batches.user_id = auth.uid()
    )
  );

create policy "Users can manage metadata for own images" on public.metadata
  for all using (
    exists (
      select 1
      from public.images
      join public.batches on batches.id = images.batch_id
      where images.id = metadata.image_id
      and batches.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.images
      join public.batches on batches.id = images.batch_id
      where images.id = metadata.image_id
      and batches.user_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public)
values ('stockflow-originals', 'stockflow-originals', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('stockflow-enhanced', 'stockflow-enhanced', false)
on conflict (id) do nothing;

create policy "Users can upload originals to own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'stockflow-originals'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own originals" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'stockflow-originals'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own enhanced images" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'stockflow-enhanced'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Enhanced images are written by server routes with SUPABASE_SERVICE_ROLE_KEY.
create index if not exists batches_user_id_created_at_idx on public.batches(user_id, created_at desc);
create index if not exists images_batch_id_created_at_idx on public.images(batch_id, created_at);
create index if not exists metadata_image_id_idx on public.metadata(image_id);
