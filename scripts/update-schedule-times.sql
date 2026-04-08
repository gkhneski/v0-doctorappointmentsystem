-- Mevcut scheduleları güne göre güncelle
-- Salı (2) ve Perşembe (4): 13:00-18:00
-- Pazartesi (1), Çarşamba (3), Cuma (5): 11:30-18:00

UPDATE doctor_schedules
SET 
  start_time = CASE
    WHEN EXTRACT(DOW FROM schedule_date::date) IN (2, 4) THEN '13:00:00'::time
    ELSE '11:30:00'::time
  END,
  end_time = '18:00:00'::time
WHERE 
  EXTRACT(DOW FROM schedule_date::date) BETWEEN 1 AND 5;
-- DOW: 0=Pazar, 1=Pazartesi, 2=Salı, 3=Çarşamba, 4=Perşembe, 5=Cuma
