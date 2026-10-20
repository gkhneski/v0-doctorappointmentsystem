-- ============================================================
-- Hasta telefonlarini tek bicime getirir: 05XXXXXXXXX
-- ("+90 532 ...", "90532...", "532...", "0532 123 45 67" -> "05321234567")
-- Yer tutucu "0000000000", sabit hat ve yurt disi numaralara DOKUNULMAZ.
--
-- Supabase SQL Editor'de ADIM ADIM calistirin (her adimi ayri secip Run).
-- ============================================================


-- ADIM 1 — ONIZLEME (hicbir sey degistirmez): neler degisecek?
with n as (
  select id, full_name, phone,
         regexp_replace(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), '^00', '') as d
  from public.patients
)
select id, full_name, phone as eski,
       case
         when d ~ '^905[0-9]{9}$' then '0' || substr(d, 3)
         when d ~ '^5[0-9]{9}$'   then '0' || d
         when d ~ '^05[0-9]{9}$'  then d
       end as yeni
from n
where d ~ '^(905[0-9]{9}|5[0-9]{9}|05[0-9]{9})$'
  and phone is distinct from (case
         when d ~ '^905[0-9]{9}$' then '0' || substr(d, 3)
         when d ~ '^5[0-9]{9}$'   then '0' || d
         else d end)
order by full_name;


-- ADIM 2 — YEDEK (geri alabilmek icin)
create table if not exists public.patients_phone_backup_20261020 as
  select id, phone from public.patients;
-- Yedek tablo disaridan (anon key ile) okunamasin
alter table public.patients_phone_backup_20261020 enable row level security;


-- ADIM 3 — GUNCELLE
with n as (
  select id, regexp_replace(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), '^00', '') as d
  from public.patients
)
update public.patients p
set phone = case
    when n.d ~ '^905[0-9]{9}$' then '0' || substr(n.d, 3)
    when n.d ~ '^5[0-9]{9}$'   then '0' || n.d
    else n.d
  end
from n
where p.id = n.id
  and n.d ~ '^(905[0-9]{9}|5[0-9]{9}|05[0-9]{9})$'
  and p.phone is distinct from (case
    when n.d ~ '^905[0-9]{9}$' then '0' || substr(n.d, 3)
    when n.d ~ '^5[0-9]{9}$'   then '0' || n.d
    else n.d end);


-- ADIM 4 — KONTROL: hala SMS gonderilemeyen (telefonu eksik/hatali) hastalar
select full_name, phone, created_at
from public.patients
where coalesce(phone, '') !~ '^05[0-9]{9}$'
order by created_at desc
limit 200;


-- GERI ALMA (sadece bir sorun olursa):
-- update public.patients p set phone = b.phone
-- from public.patients_phone_backup_20261020 b where p.id = b.id;
--
-- Her sey yolundaysa birkac hafta sonra yedegi silebilirsiniz:
-- drop table public.patients_phone_backup_20261020;
