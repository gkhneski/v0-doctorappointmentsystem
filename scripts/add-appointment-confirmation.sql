-- Add confirmation fields to appointments table and update status values
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS confirmation_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS confirmation_token VARCHAR(100) UNIQUE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_appointments_confirmation_token ON appointments(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_appointments_confirmation_status ON appointments(confirmation_status);
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_date ON appointments(appointment_date, reminder_sent_at);

-- Update appointments status constraint to include new values
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
  CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show', 'rescheduled'));

-- Add comment
COMMENT ON COLUMN appointments.confirmation_status IS 'Randevu onay durumu: pending, confirmed, cancelled';
COMMENT ON COLUMN appointments.confirmation_token IS 'Hastanın randevuyu onaylamak için kullanacağı benzersiz token';
COMMENT ON COLUMN appointments.reminder_sent_at IS 'Hatırlatma SMS''inin gönderilme zamanı';
