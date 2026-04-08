-- 2026 senesinin tüm doktor programlarını ekle (eski olanları sil)
-- Pazartesi (1) - Cuma (5): 09:00-18:00, 15 dakika slot

BEGIN;

-- Eski 2026 programlarını sil
DELETE FROM doctor_schedules WHERE schedule_date >= '2026-01-01' AND schedule_date <= '2026-12-31';

-- Tüm doktorlar için
WITH doctor_list AS (
  SELECT id FROM doctors
),
dates_2026 AS (
  SELECT 
    generate_series(
      '2026-01-01'::date,
      '2026-12-31'::date,
      '1 day'::interval
    )::date as schedule_date
)
INSERT INTO doctor_schedules (
  doctor_id,
  schedule_date,
  start_time,
  end_time,
  slot_duration,
  is_available,
  is_active,
  notes
)
SELECT 
  d.id,
  dates.schedule_date,
  '09:00'::time,
  '18:00'::time,
  15,
  true,
  true,
  NULL
FROM doctor_list d
CROSS JOIN dates_2026 dates
WHERE 
  -- Sadece Pazartesi-Cuma (day_of_week 1-5, PostgreSQL uses 0=Sunday, 1=Monday...)
  EXTRACT(DOW FROM dates.schedule_date) BETWEEN 1 AND 5;

-- Kaç program eklendi?
SELECT COUNT(*) as total_schedules_2026 FROM doctor_schedules WHERE schedule_date >= '2026-01-01';

COMMIT;
