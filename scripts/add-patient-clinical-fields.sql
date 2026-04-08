-- Add clinical IVF patient form fields to patients table
-- Version 1: Add missing patient fields for dual form system

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS mother_name TEXT,
  ADD COLUMN IF NOT EXISTS father_name TEXT,
  ADD COLUMN IF NOT EXISTS birth_place TEXT,
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Türkiye',
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS registration_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS file_number TEXT,
  ADD COLUMN IF NOT EXISTS spouse_date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS spouse_phone TEXT,
  ADD COLUMN IF NOT EXISTS spouse_mother_name TEXT,
  ADD COLUMN IF NOT EXISTS spouse_father_name TEXT,
  ADD COLUMN IF NOT EXISTS spouse_birth_place TEXT,
  ADD COLUMN IF NOT EXISTS spouse_occupation TEXT,
  ADD COLUMN IF NOT EXISTS spouse_country TEXT,
  ADD COLUMN IF NOT EXISTS spouse_city TEXT,
  ADD COLUMN IF NOT EXISTS spouse_district TEXT;

-- Create index for file_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_patients_file_number ON patients(file_number);

COMMENT ON COLUMN patients.mother_name IS 'Ana Adı - Patient mother name';
COMMENT ON COLUMN patients.father_name IS 'Baba Adı - Patient father name';
COMMENT ON COLUMN patients.birth_place IS 'Doğum Yeri - Birth place';
COMMENT ON COLUMN patients.occupation IS 'Meslek - Occupation';
COMMENT ON COLUMN patients.registration_date IS 'Kayıt Tarihi - Registration date';
COMMENT ON COLUMN patients.file_number IS 'Dosya No - File number (auto-generated)';
