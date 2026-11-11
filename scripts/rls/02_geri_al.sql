-- 2. adımın geri alınması: kuralları adımdan önceki hâline döndürür.
begin;
create policy "Tokens are publicly readable for validation" on public.appointment_access_tokens for select to anon, authenticated using ((used_at is null) and (expires_at > now()));
create policy "appointments_insert_all" on public.appointments for insert with check (true);
drop policy "appointments_insert_admin" on public.appointments;
commit;
