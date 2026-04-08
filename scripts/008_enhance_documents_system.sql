-- Evrak sistemini geliştir: kategori, durum ve yorum özellikleri ekle

-- patient_documents tablosuna yeni kolonlar ekle
ALTER TABLE patient_documents
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS comments TEXT,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES admin_users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Kategori için index ekle
CREATE INDEX IF NOT EXISTS idx_patient_documents_category ON patient_documents(category);
CREATE INDEX IF NOT EXISTS idx_patient_documents_status ON patient_documents(status);
CREATE INDEX IF NOT EXISTS idx_patient_documents_patient_id ON patient_documents(patient_id);

-- Mevcut evrakları kategorize et (eğer category null ise)
UPDATE patient_documents
SET category = 'other'
WHERE category IS NULL;

-- RLS politikalarını güncelle (Admin yorumlama yapabilsin)
DROP POLICY IF EXISTS "Admin can update documents" ON patient_documents;
CREATE POLICY "Admin can update documents"
  ON patient_documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

COMMENT ON COLUMN patient_documents.category IS 'Evrak kategorisi: hormone_tests, hsg, spermiogram, genetic_tests, surgery_reports, other';
COMMENT ON COLUMN patient_documents.status IS 'Evrak durumu: pending, approved, rejected, needs_review';
COMMENT ON COLUMN patient_documents.comments IS 'Doktor yorumları';
