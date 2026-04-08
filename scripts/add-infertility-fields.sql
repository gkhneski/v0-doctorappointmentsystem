-- Add referred_by and blood_group to patients table
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS referred_by TEXT,
ADD COLUMN IF NOT EXISTS blood_group TEXT,
ADD COLUMN IF NOT EXISTS spouse_name TEXT,
ADD COLUMN IF NOT EXISTS spouse_tc_no TEXT,
ADD COLUMN IF NOT EXISTS spouse_blood_group TEXT;

COMMIT;

-- Create infertility_evaluations table
CREATE TABLE IF NOT EXISTS infertility_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  
  -- General Info
  doctor_name TEXT,
  evaluation_date DATE,
  file_number TEXT,
  
  -- Infertility Status
  infertility_type TEXT, -- primer or sekonder
  infertility_duration INTEGER,
  
  -- GPYAE
  g_value INTEGER DEFAULT 0,
  p_value INTEGER DEFAULT 0,
  y_value INTEGER DEFAULT 0,
  a_value INTEGER DEFAULT 0,
  e_value INTEGER DEFAULT 0,
  
  -- Symptoms (JSON format for details)
  symptoms JSONB DEFAULT '{}',
  
  -- Female Anamnesis
  female_anamnesis JSONB DEFAULT '{}',
  
  -- Male Anamnesis  
  male_anamnesis JSONB DEFAULT '{}',
  
  -- Lab Results
  lab_results JSONB DEFAULT '{}',
  
  -- Diagnoses
  diagnoses JSONB DEFAULT '{}',
  
  -- Spermiogram
  spermiogram_data JSONB DEFAULT '[]',
  
  -- ART History
  art_history JSONB DEFAULT '{}',
  
  -- HSG Records
  hsg_records JSONB DEFAULT '[]',
  
  -- USG
  usg_notes TEXT,
  
  -- Frozen Material
  frozen_embryos INTEGER DEFAULT 0,
  pgd_embryos INTEGER DEFAULT 0,
  frozen_sperm INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMIT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_infertility_patient ON infertility_evaluations(patient_id);
CREATE INDEX IF NOT EXISTS idx_infertility_appointment ON infertility_evaluations(appointment_id);

COMMIT;

-- Enable RLS
ALTER TABLE infertility_evaluations ENABLE ROW LEVEL SECURITY;

COMMIT;

-- RLS Policies
CREATE POLICY "Allow admin read infertility_evaluations"
  ON infertility_evaluations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

COMMIT;

CREATE POLICY "Allow admin insert infertility_evaluations"
  ON infertility_evaluations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

COMMIT;

CREATE POLICY "Allow admin update infertility_evaluations"
  ON infertility_evaluations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

COMMIT;
