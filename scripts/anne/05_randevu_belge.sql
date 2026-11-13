-- Hasta uygulaması (/anne), beşinci adım: uygulamadan randevu ve belge yükleme.
--
--   * app_users.clinic_patient_id: hesabın bağlandığı klinik hasta kaydı. Hasta uygulamadan
--     randevu aldığında ya da numarası tek bir klinik kaydıyla eşleştiğinde yazılır.
--     Bilerek yabancı anahtar DEĞİLDİR (01_temel.sql kuralı): klinik kaydı silinirse hesap
--     bozulmaz, sunucu bağlantıyı bir sonraki istekte temizler.
--   * app_documents: hastanın yüklediği belgeler (tahlil, rapor, reçete). Dosyalar herkese
--     kapalı "anne-belge" deposunda durur; hastaya ve personele yalnızca sunucu yolu verir.
--   * seen_at: klinik belgeyi ilk açtığında yazılır; hasta "klinik gördü" bilgisini görür.
-- Kurallar 01_temel.sql ile aynı: satır güvenliği açık, kural yok, yalnızca sunucu erişir.
-- Yeniden çalıştırılabilir. Geri almak için: 05_randevu_belge_geri_al.sql

alter table public.app_users add column if not exists clinic_patient_id uuid;

create index if not exists idx_app_users_clinic_patient
  on public.app_users (clinic_patient_id) where clinic_patient_id is not null;

create table if not exists public.app_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  category text not null check (category in
    ('kan_tahlili', 'idrar_tahlili', 'ultrason', 'tarama_testi', 'rapor', 'recete', 'diger')),
  title text check (char_length(title) <= 80),
  storage_path text not null unique,
  mime text not null check (mime in ('image/jpeg', 'application/pdf')),
  size_bytes integer not null check (size_bytes > 0),
  seen_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_app_documents_user on public.app_documents (user_id, created_at desc);

alter table public.app_documents enable row level security;
revoke all on public.app_documents from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('anne-belge', 'anne-belge', false, 5242880, array['image/jpeg', 'application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
