-- Fix: Backfill appointment_type from notes for existing appointments
-- This handles appointments created before the appointment_type column was added

UPDATE appointments
SET appointment_type = TRIM(
  SUBSTRING(notes FROM 'Randevu Tipi:\s*(.+)')
)
WHERE appointment_type IS NULL
AND notes IS NOT NULL
AND notes LIKE '%Randevu Tipi:%';

-- Verify the update
SELECT id, appointment_type, notes FROM appointments WHERE appointment_type IS NOT NULL;
