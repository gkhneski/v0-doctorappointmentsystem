-- Ek bulgu: form bağlantısı belirteçleri girişsiz listelenebiliyor; randevu tablosuna girişsiz satır eklenebiliyor.
-- Kod ikisini de servis rolüyle yapıyor; tarayıcıdan kullanan yok.
begin;
drop policy "Tokens are publicly readable for validation" on public.appointment_access_tokens;
create policy "appointments_insert_admin" on public.appointments for insert to authenticated with check (exists (select 1 from public.admin_users au where au.id = (select auth.uid())));
drop policy "appointments_insert_all" on public.appointments;
commit;
