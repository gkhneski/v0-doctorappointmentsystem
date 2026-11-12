-- 03_uretim.sql dosyasını geri alır. DİKKAT: üretim kayıtları silinir.
-- Depodaki dosyalar için önce Supabase panelinden "anne-uretim" deposunu boşaltın;
-- dolu depo silinemez.

drop table if exists public.app_generations;
alter table public.app_users drop column if exists generation_allowance;
delete from storage.buckets where id = 'anne-uretim';
