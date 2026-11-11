-- G24: Belgeler, mesaj şablonları, gönderilen mesajlar, SMS kodları, referanslar ve dosya deposu
-- "giriş yapmış herkese" açık. "Personel tablosunda olan" koşuluna çevrilir.
-- Bugün giriş yapabilen yalnızca personel olduğu için davranış değişmez; hasta uygulaması gelmeden kapatılır.
begin;
create policy "patient_documents_staff_all" on public.patient_documents for all to authenticated using (exists (select 1 from public.admin_users au where au.id = (select auth.uid()))) with check (exists (select 1 from public.admin_users au where au.id = (select auth.uid())));
drop policy "Admin can view documents" on public.patient_documents;
drop policy "Admin can insert documents" on public.patient_documents;
drop policy "Admin can update documents" on public.patient_documents;
drop policy "Admin can delete documents" on public.patient_documents;
create policy "message_templates_staff_all" on public.message_templates for all to authenticated using (exists (select 1 from public.admin_users au where au.id = (select auth.uid()))) with check (exists (select 1 from public.admin_users au where au.id = (select auth.uid())));
drop policy "Admin can view templates" on public.message_templates;
drop policy "Admin can insert templates" on public.message_templates;
drop policy "Admin can update templates" on public.message_templates;
drop policy "Admin can delete templates" on public.message_templates;
create policy "sent_messages_staff_select" on public.sent_messages for select to authenticated using (exists (select 1 from public.admin_users au where au.id = (select auth.uid())));
create policy "sent_messages_staff_insert" on public.sent_messages for insert to authenticated with check (exists (select 1 from public.admin_users au where au.id = (select auth.uid())));
drop policy "Admin can view sent messages" on public.sent_messages;
drop policy "Admin can insert sent messages" on public.sent_messages;
create policy "sms_verifications_staff_insert" on public.sms_verifications for insert to authenticated with check (exists (select 1 from public.admin_users au where au.id = (select auth.uid())));
create policy "sms_verifications_staff_update" on public.sms_verifications for update to authenticated using (exists (select 1 from public.admin_users au where au.id = (select auth.uid()))) with check (exists (select 1 from public.admin_users au where au.id = (select auth.uid())));
drop policy "System can create sms verifications" on public.sms_verifications;
drop policy "System can update sms verifications" on public.sms_verifications;
create policy "references_staff_select" on public."references" for select to authenticated using (exists (select 1 from public.admin_users au where au.id = (select auth.uid())));
create policy "references_staff_insert" on public."references" for insert to authenticated with check (exists (select 1 from public.admin_users au where au.id = (select auth.uid())));
drop policy "Admin can view references" on public."references";
drop policy "Admin can insert references" on public."references";
create policy "staff_storage_select" on storage.objects for select to authenticated using (bucket_id in ('patient-documents','patient-photos') and exists (select 1 from public.admin_users au where au.id = (select auth.uid())));
create policy "staff_storage_insert" on storage.objects for insert to authenticated with check (bucket_id in ('patient-documents','patient-photos') and exists (select 1 from public.admin_users au where au.id = (select auth.uid())));
create policy "staff_storage_delete" on storage.objects for delete to authenticated using (bucket_id in ('patient-documents','patient-photos') and exists (select 1 from public.admin_users au where au.id = (select auth.uid())));
drop policy "Authenticated users can view documents" on storage.objects;
drop policy "Authenticated users can upload documents" on storage.objects;
drop policy "Authenticated users can delete documents" on storage.objects;
drop policy "Authenticated users can upload patient photos" on storage.objects;
drop policy "Authenticated users can delete patient photos" on storage.objects;
commit;
