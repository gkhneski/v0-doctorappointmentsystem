-- OPTION 1: Timezone Shift Düzeltmesi
-- Eski appointments'lerin 1 gün öncesinde kaydedilmiş olanları fix et
-- Bu script koşmadan BACKUP al!

BEGIN;

-- Adım 1: Kaç tane appointment var, kontrol et
SELECT 
  COUNT(*) as total_appointments,
  MIN(appointment_date) as oldest_date,
  MAX(appointment_date) as newest_date
FROM appointments;

-- Adım 2: Appointments tarihlerini düzelt (1 gün ileri)
-- appointment_date type'ı date ise bu şekilde:
UPDATE appointments
SET appointment_date = appointment_date + interval '1 day'
WHERE appointment_date <= CURRENT_DATE
  AND appointment_date IS NOT NULL;

-- Adım 3: Kaç tane update edildi?
SELECT COUNT(*) as updated_count FROM appointments;

COMMIT;

-- Post-fix verification
SELECT appointment_date, COUNT(*) as count FROM appointments GROUP BY appointment_date ORDER BY appointment_date;
