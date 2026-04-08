-- Ocak 2026 iş günleri için program oluştur (sadece Pazartesi-Cuma)
-- Önce tüm randevuları ve programları temizle

DELETE FROM appointments;
DELETE FROM doctor_schedules;

-- Ocak 2026 iş günleri için programlar oluştur
-- is_active yerine is_available kullanıyoruz (doğru kolon adı)

INSERT INTO doctor_schedules (doctor_id, schedule_date, is_available, start_time, end_time)
VALUES 
  -- Pazartesi 6 Ocak 2026
  ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-06', true, '09:00', '18:00'),
  -- Salı 7 Ocak 2026
  ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-07', true, '11:00', '18:00'),
  -- Çarşamba 8 Ocak 2026
  ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-08', true, '10:00', '18:00'),
  -- Perşembe 9 Ocak 2026
  ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-09', true, '12:00', '18:00'),
  -- Cuma 10 Ocak 2026
  ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-10', true, '10:30', '18:00'),
  
  -- Pazartesi 13 Ocak 2026
  ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-13', true, '09:00', '18:00'),
  -- Salı 14 Ocak 2026
  ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-14', true, '11:00', '18:00'),
  -- Çarşamba 15 Ocak 2026
  ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-15', true, '10:00', '18:00'),
  -- Perşembe 16 Ocak 2026
  ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-16', true, '12:00', '18:00'),
  -- Cuma 17 Ocak 2026
  ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-17', true, '10:30', '18:00'),
  
  -- Pazartesi 20 Ocak 2026
  ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-20', true, '09:00', '18:00'),
  -- Salı 21 Ocak 2026
  ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-21', true, '11:00', '18:00'),
  -- Çarşamba 22 Ocak 2026
  ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-22', true, '10:00', '18:00'),
  -- Perşembe 23 Ocak 2026
  ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-23', true, '12:00', '18:00'),
  -- Cuma 24 Ocak 2026
  ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-24', true, '10:30', '18:00'),
  
  -- Pazartesi 27 Ocak 2026
  ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-27', true, '09:00', '18:00'),
  -- Salı 28 Ocak 2026
  ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-28', true, '11:00', '18:00'),
  -- Çarşamba 29 Ocak 2026
  ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-29', true, '10:00', '18:00'),
  -- Perşembe 30 Ocak 2026
  ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-30', true, '12:00', '18:00');

-- Kontrol sorgusu: Ocak ayı programlarını göster
SELECT 
  schedule_date,
  EXTRACT(DOW FROM schedule_date) as day_of_week,
  TO_CHAR(schedule_date, 'Day') as day_name,
  start_time,
  end_time,
  is_available
FROM doctor_schedules
WHERE schedule_date >= '2026-01-01' AND schedule_date < '2026-02-01'
ORDER BY schedule_date;
