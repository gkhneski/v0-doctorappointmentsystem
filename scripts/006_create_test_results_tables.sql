-- Test sonuçları tabloları
-- Hormon test sonuçları
CREATE TABLE IF NOT EXISTS hormone_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  test_date DATE NOT NULL,
  
  -- Hormon değerleri
  fsh NUMERIC,
  lh NUMERIC,
  e2 NUMERIC,
  amh NUMERIC,
  prolactin NUMERIC,
  tsh NUMERIC,
  progesterone NUMERIC,
  testosterone NUMERIC,
  
  -- Meta bilgiler
  laboratory TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rahim filmi (HSG) sonuçları
CREATE TABLE IF NOT EXISTS hsg_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  test_date DATE NOT NULL,
  
  -- Sonuçlar
  result TEXT, -- 'normal', 'abnormal', 'partial'
  left_tube_status TEXT, -- 'open', 'blocked', 'partial'
  right_tube_status TEXT, -- 'open', 'blocked', 'partial'
  uterus_status TEXT, -- 'normal', 'abnormal'
  
  -- Detaylar
  notes TEXT,
  image_url TEXT,
  laboratory TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spermiogram sonuçları
CREATE TABLE IF NOT EXISTS spermiogram_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  test_date DATE NOT NULL,
  
  -- Parametreler
  volume NUMERIC, -- ml
  concentration NUMERIC, -- million/ml
  total_count NUMERIC, -- million
  progressive_motility NUMERIC, -- %
  non_progressive_motility NUMERIC, -- %
  immotile NUMERIC, -- %
  normal_morphology NUMERIC, -- %
  
  -- Değerlendirme
  assessment TEXT, -- 'normozoospermia', 'oligozoospermia', 'asthenozoospermia', etc.
  notes TEXT,
  laboratory TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ultrasound sonuçları
CREATE TABLE IF NOT EXISTS ultrasound_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  test_date DATE NOT NULL,
  cycle_day INTEGER, -- Tedavi protokolünde kaçıncı gün
  
  -- Ölçümler
  endometrium_thickness NUMERIC, -- mm
  right_ovary_follicles JSONB, -- [{"size": 12.5}, {"size": 14.2}]
  left_ovary_follicles JSONB,
  total_follicle_count INTEGER,
  
  -- Notlar
  doctor_notes TEXT,
  created_by UUID REFERENCES doctors(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Genetik test sonuçları
CREATE TABLE IF NOT EXISTS genetic_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  test_date DATE NOT NULL,
  
  -- Test tipi
  test_type TEXT NOT NULL, -- 'karyotype', 'carrier_screening', 'pgs', 'other'
  test_name TEXT NOT NULL,
  
  -- Sonuçlar
  result TEXT, -- 'normal', 'carrier', 'affected', 'inconclusive'
  result_details JSONB,
  
  -- Meta bilgiler
  laboratory TEXT,
  notes TEXT,
  report_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE hormone_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE hsg_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE spermiogram_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ultrasound_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE genetic_tests ENABLE ROW LEVEL SECURITY;

-- Admin kullanıcılar tüm test sonuçlarını görebilir
CREATE POLICY "Admin can view all hormone tests" ON hormone_tests
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage hormone tests" ON hormone_tests
  FOR ALL USING (true);

CREATE POLICY "Admin can view all HSG results" ON hsg_results
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage HSG results" ON hsg_results
  FOR ALL USING (true);

CREATE POLICY "Admin can view all spermiogram results" ON spermiogram_results
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage spermiogram results" ON spermiogram_results
  FOR ALL USING (true);

CREATE POLICY "Admin can view all ultrasound results" ON ultrasound_results
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage ultrasound results" ON ultrasound_results
  FOR ALL USING (true);

CREATE POLICY "Admin can view all genetic tests" ON genetic_tests
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage genetic tests" ON genetic_tests
  FOR ALL USING (true);

-- İndeksler (performans için)
CREATE INDEX IF NOT EXISTS idx_hormone_tests_patient ON hormone_tests(patient_id);
CREATE INDEX IF NOT EXISTS idx_hsg_results_patient ON hsg_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_spermiogram_results_patient ON spermiogram_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_ultrasound_results_patient ON ultrasound_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_genetic_tests_patient ON genetic_tests(patient_id);
