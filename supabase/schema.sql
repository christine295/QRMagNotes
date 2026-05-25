-- QRMagNotes Schema
-- Run this in the Supabase SQL editor for a new project

-- Profiles: auto-created on signup via trigger
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamp with time zone default now()
);

-- Trigger: insert profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Hubs
create table public.hubs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  slug text unique not null,
  mode text not null default 'landing' check (mode in ('landing', 'redirect')),
  redirect_url text,
  title text not null,
  description text,
  image_url text,
  theme_color text default '#3B82F6',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Hub Links
create table public.hub_links (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.hubs(id) on delete cascade,
  label text not null,
  url text,
  type text not null default 'link' check (type in ('link', 'phone', 'note')),
  image_url text,
  sort_order integer not null default 0
);

-- updated_at trigger for hubs
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_hubs_updated_at
  before update on public.hubs
  for each row execute function public.update_updated_at();

-- ==================
-- Row Level Security
-- ==================

alter table public.profiles enable row level security;
alter table public.hubs enable row level security;
alter table public.hub_links enable row level security;

-- Profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Hubs: public read, owner write
create policy "Anyone can view hubs"
  on public.hubs for select
  using (true);

create policy "Users can insert own hubs"
  on public.hubs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own hubs"
  on public.hubs for update
  using (auth.uid() = user_id);

create policy "Users can delete own hubs"
  on public.hubs for delete
  using (auth.uid() = user_id);

create policy "Anyone can view hub_links"
  on public.hub_links for select
  using (true);

create policy "Users can manage own hub_links"
  on public.hub_links for all
  using (
    exists (
      select 1 from public.hubs
      where hubs.id = hub_links.hub_id
        and hubs.user_id = auth.uid()
    )
  );


-- ==================
-- Collections
-- ==================
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  cover_image text,
  theme_color text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- updated_at trigger for collections
create trigger update_collections_updated_at
  before update on public.collections
  for each row execute function public.update_updated_at();

-- Collections RLS
alter table public.collections enable row level security;
create policy "Anyone can view collections"
  on public.collections for select
  using (true);
create policy "Users can insert own collections"
  on public.collections for insert
  with check (auth.uid() = user_id);
create policy "Users can update own collections"
  on public.collections for update
  using (auth.uid() = user_id);
create policy "Users can delete own collections"
  on public.collections for delete
  using (auth.uid() = user_id);

-- ==================
-- Content Blocks
-- ==================
create table public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.hubs(id) on delete cascade,
  type text not null check (type in ('text', 'image', 'audio', 'file', 'links', 'phone', 'checklist', 'timeline', 'note')),
  data jsonb not null,
  sort_order integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- updated_at trigger for content_blocks
create trigger update_content_blocks_updated_at
  before update on public.content_blocks
  for each row execute function public.update_updated_at();

-- Content Blocks RLS
alter table public.content_blocks enable row level security;
create policy "Anyone can view content_blocks"
  on public.content_blocks for select
  using (true);
create policy "Users can manage own content_blocks"
  on public.content_blocks for all
  using (
    exists (
      select 1 from public.hubs
      where hubs.id = content_blocks.hub_id
        and hubs.user_id = auth.uid()
    )
  );

-- ==================
-- Schema Changes: Hubs
-- ==================
alter table public.hubs add column if not exists collection_id uuid references public.collections(id) on delete set null;
alter table public.hubs add column if not exists privacy_mode text not null default 'public' check (privacy_mode in ('public', 'unlisted', 'private'));

-- ==================
-- Privacy Mode RLS
-- ==================
-- Replace open hub read policy with privacy-aware one:
drop policy if exists "Anyone can view hubs" on public.hubs;
create policy "View hubs based on privacy"
  on public.hubs for select
  using (privacy_mode in ('public', 'unlisted') or auth.uid() = user_id);

-- Restrict hub_links to match hub privacy:
drop policy if exists "Anyone can view hub_links" on public.hub_links;
create policy "View hub_links based on hub privacy"
  on public.hub_links for select
  using (
    exists (
      select 1 from public.hubs
      where hubs.id = hub_links.hub_id
        and (hubs.privacy_mode in ('public', 'unlisted') or hubs.user_id = auth.uid())
    )
  );
