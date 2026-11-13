-- 07_tema_sus.sql dosyasını geri alır.
drop table if exists public.app_accessories;
drop table if exists public.app_looks;
alter table public.app_users drop constraint if exists app_users_theme_check;
alter table public.app_users drop column if exists theme;
