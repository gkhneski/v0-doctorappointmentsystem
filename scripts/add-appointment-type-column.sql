-- Add appointment_type column to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS appointment_type TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_type 
ON appointments(appointment_type);

-- Extract appointment types from existing notes and update the column
UPDATE appointments
SET appointment_type = (
  SELECT TRIM(SUBSTRING(notes FROM 'Randevu Tipi:\s*(.+?)(?:\n|$)'))
  WHERE notes LIKE '%Randevu Tipi:%'
)
WHERE notes IS NOT NULL 
AND notes LIKE '%Randevu Tipi:%'
AND appointment_type IS NULL;
