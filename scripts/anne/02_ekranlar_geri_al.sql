-- 02_ekranlar.sql dosyasını geri alır. Kayıtlar ve albüm dosyalarının satırları silinir.
-- Depodaki dosyalar ayrıca silinmelidir (Supabase panelinden "anne-album" deposu).
drop table if exists public.app_photos;
drop table if exists public.app_visit_questions;
drop table if exists public.app_name_likes;
drop table if exists public.app_kick_sessions;
