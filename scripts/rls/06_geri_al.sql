-- 6. adımın geri alınması: kuralları adımdan önceki hâline döndürür.
begin;
create policy "Doktorlar notları okuyabilir" on public.doctor_notes for select using (true);
create policy "Doktorlar not ekleyebilir" on public.doctor_notes for insert with check (true);
create policy "Doktorlar notları güncelleyebilir" on public.doctor_notes for update using (true);
create policy "Doktorlar notları silebilir" on public.doctor_notes for delete using (true);
drop policy "doctor_notes_staff_all" on public.doctor_notes;
commit;
