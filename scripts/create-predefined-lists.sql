-- Create table for predefined medication/vitamin/test lists
CREATE TABLE IF NOT EXISTS predefined_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('medication', 'vitamin', 'test')),
  items TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE predefined_lists ENABLE ROW LEVEL SECURITY;

-- Admin users can do everything
CREATE POLICY "Admin can manage predefined lists" ON predefined_lists
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Insert some default lists
INSERT INTO predefined_lists (name, category, items) VALUES
  ('Hamilelik İlaçları', 'medication', ARRAY['Aspirin 100mg', 'Folik Asit 5mg', 'Demir Tablet']),
  ('Genel İlaçlar', 'medication', ARRAY['Aspirin', 'Parasetamol', 'İbuprofen']),
  ('Genel Vitaminler', 'vitamin', ARRAY['D3 Vitamini', 'B12 Vitamini', 'Folik Asit']),
  ('Hamilelik Vitaminleri', 'vitamin', ARRAY['Prenatal Vitamin', 'Omega-3', 'Demir']),
  ('Genel Tahliller', 'test', ARRAY['Tam Kan', 'Hormon Profili', 'Vitamin Paneli']),
  ('İnfertilite Tahlilleri', 'test', ARRAY['Hormon Tahlili', 'Sperm Tahlili', 'AMH Testi']);
