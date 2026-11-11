-- G23: patients tablosunda girişsiz güncelleme ve ekleme izni tanımlı. Önce personel için açık kural eklenir
-- (hasta detay ekranı tarayıcıdan güncelliyor), sonra girişsiz izinler kaldırılır.
-- Herkese açık randevu akışı servis rolüyle yazdığı için etkilenmez.
begin;
create policy "patients_update_admin" on public.patients for update to authenticated using (exists (select 1 from public.admin_users au where au.id = (select auth.uid()))) with check (exists (select 1 from public.admin_users au where au.id = (select auth.uid())));
create policy "patients_insert_admin" on public.patients for insert to authenticated with check (exists (select 1 from public.admin_users au where au.id = (select auth.uid())));
drop policy "Allow update profile photo" on public.patients;
drop policy "anon_update_patients" on public.patients;
drop policy "anon_insert_patients" on public.patients;
drop policy "patients_insert_all" on public.patients;
commit;
