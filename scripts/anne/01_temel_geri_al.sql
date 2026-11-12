-- 01_temel.sql'i geri alır. DİKKAT: hasta uygulamasının bütün hesaplarını ve oturumlarını siler.
-- Klinik tablolarına dokunmaz.

drop table if exists public.app_consents;
drop table if exists public.app_sessions;
drop table if exists public.app_login_codes;
drop table if exists public.app_users;
