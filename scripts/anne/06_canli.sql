-- Hasta uygulaması (/anne), altıncı adım: "Canlı bebeğim" — üretilen bebek yüzünün kısa
-- canlandırmaları (gülümseme, esneme, kıkırdama...).
--
--   * Her satır bir "an": bir yüz resminden (app_generations) üretilmiş birkaç saniyelik video.
--   * Hesap başına günde en çok bir yeni an açılır (user_id, day tekil). Başarısız deneme
--     satırı silinir; o günün hakkı yanmaz.
--   * Aynı yüz için aynı an iki kez üretilmez (generation_id, kind tekil).
--   * Videolar herkese kapalı "anne-video" deposunda durur; yalnızca sunucu yolu verir.
-- Kurallar 01_temel.sql ile aynı: satır güvenliği açık, kural yok, yalnızca sunucu erişir.
-- Yeniden çalıştırılabilir. Geri almak için: 06_canli_geri_al.sql

create table if not exists public.app_moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  generation_id uuid not null references public.app_generations (id) on delete cascade,
  kind text not null check (kind in ('gulumse', 'esne', 'kikirde', 'agu', 'emme', 'somurt', 'hapsir')),
  status text not null default 'processing' check (status in ('processing', 'ready')),
  -- Anın açıldığı gün (İstanbul tarihi).
  day date not null,
  storage_path text unique,
  model text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, day),
  unique (generation_id, kind)
);

create index if not exists idx_app_moments_user on public.app_moments (user_id, created_at);

alter table public.app_moments enable row level security;
revoke all on public.app_moments from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('anne-video', 'anne-video', false, 20971520, array['video/mp4'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
