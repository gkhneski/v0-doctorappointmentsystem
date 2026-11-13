-- Hasta uygulaması (/anne), yedinci adım: cinsiyete göre renkler ve "Süsle".
--
--   * app_users.theme: annenin seçtiği renk teması. Boşsa tema, üretilen bebek yüzünde
--     seçilmiş cinsiyetten çıkarılır (kız: pembe, erkek: mavi, bilinmiyorsa sade).
--   * app_looks: annenin bebeğin yüzüne taktığı aksesuarlar ve yerleri (hesap başına tek satır).
--   * app_accessories: günlük hediye olarak açılmış aksesuarlar. Hesap başına günde en çok
--     bir hediye açılır (user_id, day tekil); aynı aksesuar iki kez açılmaz.
-- Kurallar 01_temel.sql ile aynı: satır güvenliği açık, kural yok, yalnızca sunucu erişir.
-- Yeniden çalıştırılabilir. Geri almak için: 07_tema_sus_geri_al.sql

alter table public.app_users add column if not exists theme text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'app_users_theme_check') then
    alter table public.app_users
      add constraint app_users_theme_check check (theme is null or theme in ('kiz', 'erkek', 'sade'));
  end if;
end $$;

create table if not exists public.app_looks (
  user_id uuid primary key references public.app_users (id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_accessories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  item text not null check (char_length(item) between 1 and 40),
  -- Hediyenin açıldığı gün (İstanbul tarihi).
  day date not null,
  created_at timestamptz not null default now(),
  unique (user_id, item),
  unique (user_id, day)
);

alter table public.app_looks enable row level security;
alter table public.app_accessories enable row level security;
revoke all on public.app_looks from anon, authenticated;
revoke all on public.app_accessories from anon, authenticated;
