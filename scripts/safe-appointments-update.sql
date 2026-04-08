-- First drop the constraint
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Add confirmation columns
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS confirmation_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS confirmation_token VARCHAR(100);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- Fix existing data
UPDATE appointments SET status = 'scheduled' WHERE status IS NULL OR status = '';
UPDATE appointments SET status = 'scheduled' WHERE status NOT IN ('scheduled', 'completed', 'cancelled', 'no-show', 'rescheduled');

-- Re-add the constraint
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
  CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show', 'rescheduled'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_appointments_confirmation_token ON appointments(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_appointments_confirmation_status ON appointments(confirmation_status);
