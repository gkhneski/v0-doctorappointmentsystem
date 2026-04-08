-- Add is_demo flag and blacklist fields to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT false;

ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS blacklist_reason TEXT;

-- Mark existing patients as demo (optional - remove if not needed)
-- UPDATE patients SET is_demo = true WHERE created_at < NOW() - INTERVAL '1 day';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_patients_is_demo ON patients(is_demo);
CREATE INDEX IF NOT EXISTS idx_patients_is_blacklisted ON patients(is_blacklisted);
