-- G26: Dört veritabanı işlevi girişsiz çağrılabiliyor. Giriş yapmış personel ve sunucu çağırmaya devam eder.
begin;
revoke execute on function public.find_patient_by_name(text), public.search_patients_tr(text), public.tr_fold(text), public.prevent_appointment_audit_mutation() from public, anon;
grant execute on function public.find_patient_by_name(text), public.search_patients_tr(text), public.tr_fold(text), public.prevent_appointment_audit_mutation() to authenticated, service_role;
commit;
