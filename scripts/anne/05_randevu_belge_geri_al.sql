-- 05_randevu_belge.sql dosyasını geri alır.
-- Depodaki dosyalar SQL ile silinemez; önce panelden "anne-belge" deposu boşaltılıp silinir.
drop table if exists public.app_documents;
drop index if exists public.idx_app_users_clinic_patient;
alter table public.app_users drop column if exists clinic_patient_id;
