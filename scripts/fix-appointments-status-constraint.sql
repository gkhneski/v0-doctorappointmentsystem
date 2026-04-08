-- Fix appointments status constraint to include all valid values
-- Drop existing constraint
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Add updated constraint with all valid status values
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
  CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show', 'pending'));

-- Update any existing 'pending' status to 'scheduled' for clarity
UPDATE appointments SET status = 'scheduled' WHERE status = 'pending';
