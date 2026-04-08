-- Set the correct appointment type for gökhan eski's appointment
UPDATE appointments
SET appointment_type = 'jinekolojik-muayene',
    notes = 'Randevu Tipi: jinekolojik-muayene'
WHERE id = '6b32c129-87a0-4f3b-b7ff-0a27420a57a8';

-- Verify
SELECT id, appointment_type, notes FROM appointments WHERE id = '6b32c129-87a0-4f3b-b7ff-0a27420a57a8';
