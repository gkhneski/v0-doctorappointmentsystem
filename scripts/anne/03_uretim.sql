-- Hasta uygulaması (/anne), üçüncü adım: bebek yüzü üretimi.
-- Kurallar 01_temel.sql ile aynı: yalnızca app_ tabloları, satır güvenliği açık, kural yok,
-- tarayıcı rolleri (anon, authenticated) hiçbir şey göremez; erişim yalnızca sunucudan.
-- Geri almak için: 03_uretim_geri_al.sql

-- Hesabın üretim hakkı. Hak yalnızca BAŞARILI üretimde düşer: kalan hak =
-- generation_allowance - (generated + processing satır sayısı). İlk üretim ücretsizdir.
alter table public.app_users
  add column if not exists generation_allowance integer not null default 1 check (generation_allowance >= 0);

create table if not exists public.app_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  -- draft: ölçüm kâğıtları okunuyor, üretim başlamadı.
  -- processing -> generated | failed. generated ve failed son durumdur.
  status text not null default 'draft' check (status in ('draft', 'processing', 'generated', 'failed')),
  -- Kâğıttan okunan ölçümler (mm). Hastaya gösterilmez; yalnızca üretim yönergesine girer.
  biometrics jsonb not null default '{}'::jsonb,
  papers_read integer not null default 0 check (papers_read between 0 and 20),
  pregnancy_week integer check (pregnancy_week between 18 and 44),
  gender text check (gender in ('female', 'male')),
  model text,
  provider text,
  prompt_used text,
  storage_path text unique,
  -- Hastaya gösterilen kısa neden ve sunucu kaydı için ayrıntı.
  error text,
  error_detail text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists idx_app_generations_user on public.app_generations (user_id, created_at desc);

-- Hesap başına tek taslak ve aynı anda tek üretim.
create unique index if not exists app_generations_one_draft on public.app_generations (user_id) where status = 'draft';
create unique index if not exists app_generations_one_processing on public.app_generations (user_id) where status = 'processing';

alter table public.app_generations enable row level security;
revoke all on public.app_generations from anon, authenticated;

-- Üretilen resimler: herkese kapalı depo. Dosyalar yalnızca sunucu üzerinden, sahibine verilir.
-- Hastanın yüklediği ultrason ve kâğıt fotoğrafları HİÇ saklanmaz.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('anne-uretim', 'anne-uretim', false, 26214400, array['image/png'])
on conflict (id) do nothing;
