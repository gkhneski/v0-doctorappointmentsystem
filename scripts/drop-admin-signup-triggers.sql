-- GÜVENLİK (Faz 0, G1): yeni kayıt olan kullanıcıyı otomatik yönetici yapan tetikleyicileri kaldır.
--
-- on_auth_user_created_check_admin -> handle_new_admin_user():
--   kayıt sırasında gönderilen metadata'daki "role" değeriyle admin_users'a satır ekliyordu.
--   Herkese açık kayıt açıksa, anon anahtarı bilen biri kendini "doktor" yapabiliyordu.
-- on_auth_user_created_make_admin -> make_first_user_admin():
--   admin_users boşken ilk kayıt olanı süper yönetici yapıyordu.
--
-- Personel ekleme bunlara bağlı değil: app/api/admin/staff/route.ts ve
-- app/api/admin/signup/route.ts admin_users satırını kendileri yazıyor.
--
-- 11.11.2026 tarihinde canlı veritabanında çalıştırıldı.

DROP TRIGGER IF EXISTS on_auth_user_created_check_admin ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_make_admin ON auth.users;

-- Tetikleyici işlevleri artık kullanılmıyor
DROP FUNCTION IF EXISTS public.handle_new_admin_user();
DROP FUNCTION IF EXISTS public.make_first_user_admin();

-- Kontrol: sonuç boş dönmeli
SELECT t.tgname AS kalan_tetikleyici
FROM pg_trigger t
WHERE t.tgrelid = 'auth.users'::regclass
  AND NOT t.tgisinternal;
