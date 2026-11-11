-- G20: Gebelik tabloları girişsiz okunabiliyor. Okuma yalnızca personele.
begin;
create policy "Staff can view pregnancy episodes" on public.pregnancy_episodes for select to authenticated using (exists (select 1 from public.admin_users au where au.id = (select auth.uid())));
create policy "Staff can view pregnancy outcomes" on public.pregnancy_outcomes for select to authenticated using (exists (select 1 from public.admin_users au where au.id = (select auth.uid())));
create policy "Staff can view pregnancy visits" on public.pregnancy_visits for select to authenticated using (exists (select 1 from public.admin_users au where au.id = (select auth.uid())));
drop policy "All can view pregnancy episodes" on public.pregnancy_episodes;
drop policy "All can view pregnancy outcomes" on public.pregnancy_outcomes;
drop policy "All can view pregnancy visits" on public.pregnancy_visits;
commit;
