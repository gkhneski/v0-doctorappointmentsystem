-- Tüm 2026 yılı için doğru çalışma saatlerini ayarla
-- Pazartesi (1), Çarşamba (3), Cuma (5): 11:30-17:45
-- Salı (2), Perşembe (4): 13:30-17:45
-- Hafta sonu (Cumartesi=6, Pazar=0) schedule'ları is_available=false yapılır

-- Pazartesi, Çarşamba, Cuma saatlerini güncelle
-- is_available=true olan (yani bloke OLMAYAN) kayıtları güncelle
UPDATE doctor_schedules
SET 
  start_time = '11:30:00',
  end_time = '17:45:00',
  is_available = true
WHERE 
  doctor_id = '8d8e6b45-ed47-4e79-be36-5f1bce4203e6'
  AND EXTRACT(DOW FROM schedule_date) IN (1, 3, 5)
  AND schedule_date >= '2026-01-01';

-- Salı, Perşembe saatlerini güncelle
UPDATE doctor_schedules
SET 
  start_time = '13:30:00',
  end_time = '17:45:00',
  is_available = true
WHERE 
  doctor_id = '8d8e6b45-ed47-4e79-be36-5f1bce4203e6'
  AND EXTRACT(DOW FROM schedule_date) IN (2, 4)
  AND schedule_date >= '2026-01-01';

-- Hafta sonu günlerini kapalı yap
UPDATE doctor_schedules
SET 
  is_available = false
WHERE 
  doctor_id = '8d8e6b45-ed47-4e79-be36-5f1bce4203e6'
  AND EXTRACT(DOW FROM schedule_date) IN (0, 6)
  AND schedule_date >= '2026-01-01';

-- Sonucu kontrol et
SELECT 
  TO_CHAR(schedule_date, 'YYYY-MM-DD') as tarih,
  TO_CHAR(schedule_date, 'Day') as gun,
  EXTRACT(DOW FROM schedule_date) as gun_no,
  start_time,
  end_time,
  is_available
FROM doctor_schedules
WHERE doctor_id = '8d8e6b45-ed47-4e79-be36-5f1bce4203e6'
  AND schedule_date BETWEEN '2026-03-30' AND '2026-04-05'
ORDER BY schedule_date;
