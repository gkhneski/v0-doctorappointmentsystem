-- Hasta uygulaması (/anne), ikinci adım: yeni ekranların kayıtları.
-- Tekme oturumları, beğenilen isimler, vizitede sorulacak sorular, albüm fotoğrafları.
-- Kurallar 01_temel.sql ile aynı: yalnızca app_ tabloları, satır güvenliği açık, kural yok,
-- tarayıcı rolleri (anon, authenticated) hiçbir şey göremez; erişim yalnızca sunucudan.
-- Geri almak için: 02_ekranlar_geri_al.sql

create table if not exists public.app_kick_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  kick_count integer not null check (kick_count between 1 and 500),
  duration_seconds integer not null check (duration_seconds between 0 and 86400),
  created_at timestamptz not null default now()
);
create index if not exists idx_app_kick_sessions_user on public.app_kick_sessions (user_id, created_at desc);

create table if not exists public.app_name_likes (
  user_id uuid not null references public.app_users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  created_at timestamptz not null default now(),
  primary key (user_id, name)
);

create table if not exists public.app_visit_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  body text not null check (char_length(body) between 3 and 300),
  asked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_app_visit_questions_user on public.app_visit_questions (user_id, created_at desc);

create table if not exists public.app_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  kind text not null check (kind in ('karin', 'ultrason')),
  week integer not null check (week between 0 and 44),
  storage_path text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists idx_app_photos_user on public.app_photos (user_id, kind, week);

alter table public.app_kick_sessions enable row level security;
alter table public.app_name_likes enable row level security;
alter table public.app_visit_questions enable row level security;
alter table public.app_photos enable row level security;

revoke all on public.app_kick_sessions, public.app_name_likes, public.app_visit_questions, public.app_photos
  from anon, authenticated;

-- Albüm dosyaları: herkese kapalı depo. Dosyalar yalnızca sunucu üzerinden, sahibine verilir.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('anne-album', 'anne-album', false, 4194304, array['image/jpeg'])
on conflict (id) do nothing;
