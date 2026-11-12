-- Hasta uygulaması (/anne), dördüncü adım: silinen hesaplardan kalan kullanım kaydı.
--
-- Hesabını silip aynı numarayla yeniden açan kişi ücretsiz bebek yüzü üretim hakkını
-- yeniden kazanmasın diye, hesap silinirken yalnızca şu iki bilgi kalır:
--   * numaranın sunucu sırrıyla anahtarlanmış özeti (numara saklanmaz, özetten geri dönülemez),
--   * o numarayla başarıyla üretilmiş resim sayısı.
-- Kurallar 01_temel.sql ile aynı: satır güvenliği açık, kural yok, yalnızca sunucu erişir.
-- Geri almak için: 04_kullanim_kaydi_geri_al.sql

create table if not exists public.app_phone_usage (
  phone_key text primary key check (phone_key ~ '^[0-9a-f]{64}$'),
  generations_used integer not null default 0 check (generations_used >= 0),
  updated_at timestamptz not null default now()
);

alter table public.app_phone_usage enable row level security;
revoke all on public.app_phone_usage from anon, authenticated;
