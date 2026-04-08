-- Tedavi & Protokol tabloları
-- Bu script hasta tedavi takibi için gerekli tabloları oluşturur

-- Treatments tablosu (Aktif tedaviler)
CREATE TABLE IF NOT EXISTS treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  treatment_type VARCHAR(100) NOT NULL, -- 'IVF', 'ICSI', 'IUI', 'Asilama', 'Tup Bebek' vb.
  protocol_name VARCHAR(100), -- 'Long Protocol', 'Short Protocol', 'Antagonist Protocol' vb.
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'cancelled', 'on_hold'
  responsible_doctor VARCHAR(100),
  cycle_day INTEGER, -- Tedavinin kaçıncı günü
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medications tablosu (İlaç takvimi)
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medication_name VARCHAR(200) NOT NULL,
  dosage VARCHAR(100), -- '150 IU', '5mg' vb.
  route VARCHAR(50), -- 'Subkutan İğne', 'Oral', 'IM İğne' vb.
  frequency VARCHAR(100), -- 'Günde 2 kez', 'Sabah', 'Akşam' vb.
  start_date DATE NOT NULL,
  end_date DATE,
  start_day INTEGER, -- Stimülasyonun kaçıncı gününde başladı
  end_day INTEGER,
  time_of_day VARCHAR(50), -- '09:00', '21:00' vb.
  is_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Procedures tablosu (Prosedür takvimi)
CREATE TABLE IF NOT EXISTS procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  procedure_type VARCHAR(100) NOT NULL, -- 'Ultrasound', 'Kan Testi', 'OPU', 'ET', 'Beta HCG' vb.
  procedure_date DATE NOT NULL,
  cycle_day INTEGER, -- Stimülasyonun kaçıncı günü
  results JSONB, -- Prosedür sonuçları (esnek yapı)
  notes TEXT,
  performed_by VARCHAR(100), -- Yapan doktor
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_treatments_patient ON treatments(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatments_status ON treatments(status);
CREATE INDEX IF NOT EXISTS idx_medications_treatment ON medications(treatment_id);
CREATE INDEX IF NOT EXISTS idx_medications_patient ON medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_procedures_treatment ON procedures(treatment_id);
CREATE INDEX IF NOT EXISTS idx_procedures_patient ON procedures(patient_id);
CREATE INDEX IF NOT EXISTS idx_procedures_date ON procedures(procedure_date);

-- RLS Policies
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin can manage all treatments" ON treatments FOR ALL USING (true);
CREATE POLICY "Admin can manage all medications" ON medications FOR ALL USING (true);
CREATE POLICY "Admin can manage all procedures" ON procedures FOR ALL USING (true);
