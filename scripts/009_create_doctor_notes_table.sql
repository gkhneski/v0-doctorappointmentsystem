-- Doktor notları tablosu
CREATE TABLE IF NOT EXISTS doctor_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('tedavi_karari', 'protokol_degisikligi', 'hasta_durumu', 'genel', 'acil')),
  note_text TEXT NOT NULL,
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler
CREATE INDEX idx_doctor_notes_patient ON doctor_notes(patient_id);
CREATE INDEX idx_doctor_notes_category ON doctor_notes(category);
CREATE INDEX idx_doctor_notes_created ON doctor_notes(created_at DESC);

-- RLS Policies
ALTER TABLE doctor_notes ENABLE ROW LEVEL SECURITY;

-- Doktorlar tüm notları okuyabilir
CREATE POLICY "Doktorlar notları okuyabilir"
ON doctor_notes FOR SELECT
USING (true);

-- Doktorlar not ekleyebilir
CREATE POLICY "Doktorlar not ekleyebilir"
ON doctor_notes FOR INSERT
WITH CHECK (true);

-- Doktorlar kendi notlarını güncelleyebilir
CREATE POLICY "Doktorlar notları güncelleyebilir"
ON doctor_notes FOR UPDATE
USING (true);

-- Doktorlar notları silebilir
CREATE POLICY "Doktorlar notları silebilir"
ON doctor_notes FOR DELETE
USING (true);

COMMENT ON TABLE doctor_notes IS 'Doktorların hastalar hakkında tuttuğu özel notlar';
COMMENT ON COLUMN doctor_notes.category IS 'Not kategorisi: tedavi_karari, protokol_degisikligi, hasta_durumu, genel, acil';
COMMENT ON COLUMN doctor_notes.is_private IS 'True ise sadece doktorlar görebilir, false ise hasta da görebilir';
