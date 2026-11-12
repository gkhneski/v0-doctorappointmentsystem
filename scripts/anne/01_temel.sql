-- Hasta uygulaması (/anne) — temel tablolar: hesap, giriş kodu, oturum, rıza kaydı.
--
-- Kurallar (ana plan, bölüm 6):
--   * Tüm tablolar app_ ön eklidir; mevcut klinik tablolarına (patients, appointments, ...)
--     ne başvuru ne yabancı anahtar vardır.
--   * Satır düzeyi güvenlik açık ve HİÇ politika yok: tarayıcıdan (anon / authenticated)
--     erişilemez. Yalnızca sunucu, servis rolüyle erişir ve her sorguyu oturumdaki hesaba süzer.
--   * Yetkiler ayrıca geri alınır; ileride yanlışlıkla bir politika eklense bile tablo açılmaz.
--
-- Yeniden çalıştırılabilir. Geri almak için: 01_temel_geri_al.sql

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  -- Her zaman "05XXXXXXXXX" (lib/phone.ts normalizePhone).
  phone text not null unique check (phone ~ '^05[0-9]{9}$'),
  display_name text check (char_length(display_name) <= 60),
  -- Hastanın kendi beyanı. Biri girilir, diğeri hesaplanır; hangisinin girildiği saklanır.
  lmp_date date,
  due_date date,
  due_date_source text check (due_date_source in ('lmp', 'due')),
  onboarded_at timestamptz,
  -- Klinik onayı (ücretsiz ilk üretim hakkı için; Faz 3). Onaylayan personelin auth kimliği.
  clinic_approved_at timestamptz,
  clinic_approved_by uuid,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists public.app_login_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  -- Kod düz metin saklanmaz: sha256(salt || ':' || kod).
  code_hash text not null,
  salt text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_app_login_codes_phone_time
  on public.app_login_codes (phone, created_at desc);

create table if not exists public.app_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  -- Çerezdeki belirtecin sha256 özeti; belirtecin kendisi saklanmaz.
  token_hash text not null unique,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists idx_app_sessions_user on public.app_sessions (user_id);

-- Rıza kaydı: yalnızca eklenir, güncellenmez. Geri alma da yeni bir satırdır (granted = false).
create table if not exists public.app_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  kind text not null,
  version text not null,
  granted boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_app_consents_user_kind
  on public.app_consents (user_id, kind, created_at desc);

alter table public.app_users enable row level security;
alter table public.app_login_codes enable row level security;
alter table public.app_sessions enable row level security;
alter table public.app_consents enable row level security;

revoke all on public.app_users, public.app_login_codes, public.app_sessions, public.app_consents
  from anon, authenticated;
