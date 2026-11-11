-- G25: patient-photos klasörü herkese açık (3 dosya). Kod bu klasörü kullanmıyor; hiçbir kayıt ona bağlantı vermiyor.
-- Özel yapılır. Personel okuma kuralı 08. adımda gelir (o adıma kadar yalnızca servis rolü okur).
begin;
update storage.buckets set public = false where id = 'patient-photos';
drop policy "Public can view patient photos" on storage.objects;
commit;
