-- Weekly Pattern Table - Haftalık desen sistemi
CREATE TABLE IF NOT EXISTS doctor_weekly_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  is_working BOOLEAN NOT NULL DEFAULT true,
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  slot_duration INTEGER NOT NULL DEFAULT 15,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, day_of_week)
);

-- RLS
ALTER TABLE doctor_weekly_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view weekly patterns" ON doctor_weekly_patterns
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage weekly patterns" ON doctor_weekly_patterns
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'doktor', 'hemsire', 'sekreter'))
  );

CREATE INDEX idx_weekly_patterns_doctor ON doctor_weekly_patterns(doctor_id);
