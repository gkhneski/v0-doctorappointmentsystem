-- G22: Doktor notları girişsiz okunup silinebiliyor. Yalnızca personele.
begin;
create policy "doctor_notes_staff_all" on public.doctor_notes for all to authenticated using (exists (select 1 from public.admin_users au where au.id = (select auth.uid()))) with check (exists (select 1 from public.admin_users au where au.id = (select auth.uid())));
drop policy "Doktorlar notları okuyabilir" on public.doctor_notes;
drop policy "Doktorlar not ekleyebilir" on public.doctor_notes;
drop policy "Doktorlar notları güncelleyebilir" on public.doctor_notes;
drop policy "Doktorlar notları silebilir" on public.doctor_notes;
commit;
