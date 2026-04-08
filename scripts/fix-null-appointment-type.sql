-- Fix appointments where appointment_type was stored as the string "null"
UPDATE appointments
SET appointment_type = NULL
WHERE appointment_type = 'null';

-- Also fix notes that say "Randevu Tipi: null"
UPDATE appointments
SET notes = NULL
WHERE notes = 'Randevu Tipi: null';

-- Verify
SELECT id, appointment_type, notes, 
  (SELECT full_name FROM patients WHERE patients.id = appointments.patient_id) as patient_name
FROM appointments;
