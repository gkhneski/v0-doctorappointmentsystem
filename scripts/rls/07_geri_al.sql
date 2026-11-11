-- 7. adımın geri alınması: kuralları adımdan önceki hâline döndürür.
begin;
create policy "Allow update profile photo" on public.patients for update using (true) with check (true);
create policy "anon_update_patients" on public.patients for update to anon using (true) with check (true);
create policy "anon_insert_patients" on public.patients for insert to anon with check (true);
create policy "patients_insert_all" on public.patients for insert to anon, authenticated with check (true);
drop policy "patients_update_admin" on public.patients;
drop policy "patients_insert_admin" on public.patients;
commit;
