-- Add medical_alerts column to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS medical_alerts JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the structure
COMMENT ON COLUMN patients.medical_alerts IS 'Array of medical alerts/chronic conditions. Example: [{"type": "diabetes", "severity": "high", "notes": "Insulin dependent"}, {"type": "hypertension", "severity": "moderate"}]';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_patients_medical_alerts ON patients USING GIN (medical_alerts);
