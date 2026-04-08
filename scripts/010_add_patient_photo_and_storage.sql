-- Hasta tablosuna profil fotoğrafı kolonu ekle
ALTER TABLE patients ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Supabase Storage için bucket'ları oluştur
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('patient-photos', 'patient-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']),
  ('patient-documents', 'patient-documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf', 'image/jpg'])
ON CONFLICT (id) DO NOTHING;

-- Patient photos bucket RLS politikaları
CREATE POLICY "Authenticated users can upload patient photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'patient-photos');

CREATE POLICY "Public can view patient photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'patient-photos');

CREATE POLICY "Authenticated users can delete patient photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'patient-photos');

-- Patient documents bucket RLS politikaları (sadece authenticated)
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'patient-documents');

CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'patient-documents');

CREATE POLICY "Authenticated users can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'patient-documents');

-- Indexler
CREATE INDEX IF NOT EXISTS idx_patients_profile_photo ON patients(profile_photo_url) WHERE profile_photo_url IS NOT NULL;
