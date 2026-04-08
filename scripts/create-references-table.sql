-- Create references (referans) table for managing patient references
CREATE TABLE IF NOT EXISTS public.references (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.references ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can view references" ON public.references
  FOR SELECT USING (true);

CREATE POLICY "Admin can insert references" ON public.references
  FOR INSERT WITH CHECK (true);

-- Add reference_id fields to patients table
ALTER TABLE public.patients 
  ADD COLUMN IF NOT EXISTS reference_id UUID REFERENCES public.references(id),
  ADD COLUMN IF NOT EXISTS spouse_reference_id UUID REFERENCES public.references(id),
  ADD COLUMN IF NOT EXISTS doctor TEXT,
  ADD COLUMN IF NOT EXISTS spouse_doctor TEXT,
  ADD COLUMN IF NOT EXISTS spouse_file_number TEXT,
  ADD COLUMN IF NOT EXISTS spouse_registration_date DATE;

-- Insert some default references
INSERT INTO public.references (reference_name) VALUES
  ('Internet'),
  ('Arkadaş Tavsiyesi'),
  ('Doktor Yönlendirmesi'),
  ('Sosyal Medya')
ON CONFLICT (reference_name) DO NOTHING;
