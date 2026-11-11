-- 5. adımın geri alınması: kuralları adımdan önceki hâline döndürür.
begin;
create policy "All can view pregnancy episodes" on public.pregnancy_episodes for select using (true);
create policy "All can view pregnancy outcomes" on public.pregnancy_outcomes for select using (true);
create policy "All can view pregnancy visits" on public.pregnancy_visits for select using (true);
drop policy "Staff can view pregnancy episodes" on public.pregnancy_episodes;
drop policy "Staff can view pregnancy outcomes" on public.pregnancy_outcomes;
drop policy "Staff can view pregnancy visits" on public.pregnancy_visits;
commit;
