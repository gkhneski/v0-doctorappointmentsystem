-- G21: Kodda kullanılmayan tahlil/tedavi tabloları girişsiz okunup yazılabiliyor. Tamamen kapatılır.
-- (RLS açık + kural yok = yalnızca servis rolü erişir.) Tabloların hepsi boş.
begin;
drop policy "Admin can manage genetic tests" on public.genetic_tests;
drop policy "Admin can view all genetic tests" on public.genetic_tests;
drop policy "Admin can manage hormone tests" on public.hormone_tests;
drop policy "Admin can view all hormone tests" on public.hormone_tests;
drop policy "Admin can manage HSG results" on public.hsg_results;
drop policy "Admin can view all HSG results" on public.hsg_results;
drop policy "Admin can manage spermiogram results" on public.spermiogram_results;
drop policy "Admin can view all spermiogram results" on public.spermiogram_results;
drop policy "Admin can manage ultrasound results" on public.ultrasound_results;
drop policy "Admin can view all ultrasound results" on public.ultrasound_results;
drop policy "Admin can manage all medications" on public.medications;
drop policy "Admin can manage all procedures" on public.procedures;
drop policy "Admin can manage all treatments" on public.treatments;
commit;
