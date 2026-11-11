-- 1. adımın geri alınması: kuralları adımdan önceki hâline döndürür.
begin;
create policy "Admin can manage genetic tests" on public.genetic_tests for all using (true);
create policy "Admin can view all genetic tests" on public.genetic_tests for select using (true);
create policy "Admin can manage hormone tests" on public.hormone_tests for all using (true);
create policy "Admin can view all hormone tests" on public.hormone_tests for select using (true);
create policy "Admin can manage HSG results" on public.hsg_results for all using (true);
create policy "Admin can view all HSG results" on public.hsg_results for select using (true);
create policy "Admin can manage spermiogram results" on public.spermiogram_results for all using (true);
create policy "Admin can view all spermiogram results" on public.spermiogram_results for select using (true);
create policy "Admin can manage ultrasound results" on public.ultrasound_results for all using (true);
create policy "Admin can view all ultrasound results" on public.ultrasound_results for select using (true);
create policy "Admin can manage all medications" on public.medications for all using (true);
create policy "Admin can manage all procedures" on public.procedures for all using (true);
create policy "Admin can manage all treatments" on public.treatments for all using (true);
commit;
