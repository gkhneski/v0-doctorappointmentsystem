-- Add intake form fields to patients table
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS has_completed_intake_form BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS intake_form_data JSONB,
ADD COLUMN IF NOT EXISTS intake_completed_at TIMESTAMP WITH TIME ZONE;

-- Create documents table for file uploads
CREATE TABLE IF NOT EXISTS patient_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  description TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on patient_documents
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage documents
CREATE POLICY "Service role can manage documents"
  ON patient_documents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow admin users to view documents
CREATE POLICY "Admin can view documents"
  ON patient_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_patient_documents_patient_id ON patient_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_appointment_id ON patient_documents(appointment_id);
