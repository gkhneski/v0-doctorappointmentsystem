-- Create pregnancy_episodes table
CREATE TABLE IF NOT EXISTS pregnancy_episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid NULL REFERENCES doctors(id) ON DELETE SET NULL,
  doctor_name text NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  conception_type text NULL CHECK (conception_type IN ('spontan', 'ART', 'IUI', 'operasyon', 'diger')),
  sat_date date NULL,
  edd_date date NULL,
  et_date date NULL,
  blood_group text NULL,
  rh text NULL,
  rh_incompatibility boolean NULL,
  height_cm int NULL,
  pre_weight_kg numeric NULL,
  bmi numeric NULL,
  anamnesis jsonb NOT NULL DEFAULT '{}'::jsonb,
  important_notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create unique partial index to ensure only one active pregnancy per patient
CREATE UNIQUE INDEX IF NOT EXISTS pregnancy_episodes_active_per_patient 
  ON pregnancy_episodes(patient_id) 
  WHERE status = 'active';

-- Create index on patient_id for faster lookups
CREATE INDEX IF NOT EXISTS pregnancy_episodes_patient_id_idx ON pregnancy_episodes(patient_id);

-- Create pregnancy_visits table
CREATE TABLE IF NOT EXISTS pregnancy_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id uuid NOT NULL REFERENCES pregnancy_episodes(id) ON DELETE CASCADE,
  visit_date date NOT NULL,
  topic text NULL,
  ga_weeks int NULL,
  ga_days int NULL,
  weight_kg numeric NULL,
  bp_systolic int NULL,
  bp_diastolic int NULL,
  payment_done boolean NOT NULL DEFAULT false,
  exam_notes text NULL,
  usg_metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  medications jsonb NOT NULL DEFAULT '[]'::jsonb,
  tests jsonb NOT NULL DEFAULT '{}'::jsonb,
  procedures jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index on episode_id and visit_date for faster queries
CREATE INDEX IF NOT EXISTS pregnancy_visits_episode_date_idx 
  ON pregnancy_visits(episode_id, visit_date DESC);

-- Create pregnancy_outcomes table
CREATE TABLE IF NOT EXISTS pregnancy_outcomes (
  episode_id uuid PRIMARY KEY REFERENCES pregnancy_episodes(id) ON DELETE CASCADE,
  result text NOT NULL CHECK (result IN ('dogum', 'devam', 'dusuk', 'sonlandirma', 'ulasilamadi', 'diger')),
  result_date date NULL,
  delivery_week int NULL,
  delivery_day int NULL,
  delivery_type text NULL CHECK (delivery_type IN ('C/S', 'N/D')),
  baby_count int NULL,
  hospital text NULL,
  delivery_doctor text NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add pregnancy linkage columns to patient_documents
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patient_documents' AND column_name = 'pregnancy_visit_id'
  ) THEN
    ALTER TABLE patient_documents 
      ADD COLUMN pregnancy_visit_id uuid NULL REFERENCES pregnancy_visits(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patient_documents' AND column_name = 'pregnancy_episode_id'
  ) THEN
    ALTER TABLE patient_documents 
      ADD COLUMN pregnancy_episode_id uuid NULL REFERENCES pregnancy_episodes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for filtering pregnancy documents
CREATE INDEX IF NOT EXISTS patient_documents_pregnancy_visit_idx 
  ON patient_documents(pregnancy_visit_id) 
  WHERE pregnancy_visit_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS patient_documents_pregnancy_episode_idx 
  ON patient_documents(pregnancy_episode_id) 
  WHERE pregnancy_episode_id IS NOT NULL;

-- RLS Policies for pregnancy_episodes
ALTER TABLE pregnancy_episodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view all pregnancy episodes" ON pregnancy_episodes;
CREATE POLICY "Admin can view all pregnancy episodes"
  ON pregnancy_episodes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can insert pregnancy episodes" ON pregnancy_episodes;
CREATE POLICY "Admin can insert pregnancy episodes"
  ON pregnancy_episodes FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can update pregnancy episodes" ON pregnancy_episodes;
CREATE POLICY "Admin can update pregnancy episodes"
  ON pregnancy_episodes FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can delete pregnancy episodes" ON pregnancy_episodes;
CREATE POLICY "Admin can delete pregnancy episodes"
  ON pregnancy_episodes FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for pregnancy_visits
ALTER TABLE pregnancy_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view all pregnancy visits" ON pregnancy_visits;
CREATE POLICY "Admin can view all pregnancy visits"
  ON pregnancy_visits FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can insert pregnancy visits" ON pregnancy_visits;
CREATE POLICY "Admin can insert pregnancy visits"
  ON pregnancy_visits FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can update pregnancy visits" ON pregnancy_visits;
CREATE POLICY "Admin can update pregnancy visits"
  ON pregnancy_visits FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can delete pregnancy visits" ON pregnancy_visits;
CREATE POLICY "Admin can delete pregnancy visits"
  ON pregnancy_visits FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for pregnancy_outcomes
ALTER TABLE pregnancy_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view all pregnancy outcomes" ON pregnancy_outcomes;
CREATE POLICY "Admin can view all pregnancy outcomes"
  ON pregnancy_outcomes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can insert pregnancy outcomes" ON pregnancy_outcomes;
CREATE POLICY "Admin can insert pregnancy outcomes"
  ON pregnancy_outcomes FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can update pregnancy outcomes" ON pregnancy_outcomes;
CREATE POLICY "Admin can update pregnancy outcomes"
  ON pregnancy_outcomes FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can delete pregnancy outcomes" ON pregnancy_outcomes;
CREATE POLICY "Admin can delete pregnancy outcomes"
  ON pregnancy_outcomes FOR DELETE
  TO authenticated
  USING (true);
