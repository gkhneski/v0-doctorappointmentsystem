-- 4. adımın geri alınması: kuralları adımdan önceki hâline döndürür.
begin;
grant execute on function public.find_patient_by_name(text), public.search_patients_tr(text), public.tr_fold(text), public.prevent_appointment_audit_mutation() to public, anon;
commit;
