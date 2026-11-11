-- 3. adımın geri alınması: kuralları adımdan önceki hâline döndürür.
begin;
update storage.buckets set public = true where id = 'patient-photos';
create policy "Public can view patient photos" on storage.objects for select using (bucket_id = 'patient-photos');
commit;
