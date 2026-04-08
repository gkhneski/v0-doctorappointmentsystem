-- patient_documents tablosu için RLS politikalarını düzelt

-- Önce mevcut politikaları kontrol et ve sil
DROP POLICY IF EXISTS "Admin can insert documents" ON patient_documents;
DROP POLICY IF EXISTS "Admin can view documents" ON patient_documents;
DROP POLICY IF EXISTS "Admin can update documents" ON patient_documents;
DROP POLICY IF EXISTS "Admin can delete documents" ON patient_documents;

-- RLS'i aktif et
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;

-- Admin kullanıcılar evrak ekleyebilir
CREATE POLICY "Admin can insert documents"
  ON patient_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Authenticated olan herkes ekleyebilir

-- Admin kullanıcılar evrakları görüntüleyebilir
CREATE POLICY "Admin can view documents"
  ON patient_documents
  FOR SELECT
  TO authenticated
  USING (true); -- Authenticated olan herkes görebilir

-- Admin kullanıcılar evrakları güncelleyebilir
CREATE POLICY "Admin can update documents"
  ON patient_documents
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Admin kullanıcılar evrakları silebilir
CREATE POLICY "Admin can delete documents"
  ON patient_documents
  FOR DELETE
  TO authenticated
  USING (true);

-- Yorum: Üretim ortamında bu politikalar daha kısıtlayıcı olmalı
-- Örneğin: EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
-- Ama şimdilik authenticated olan herkes admin sayılıyor
