-- Tüm randevuları ve Cumartesi/Pazar programlarını sil, Ocak 2026 iş günleri için boş programlar oluştur

-- 1) Mevcut tüm randevuları sil
DELETE FROM appointments;

-- 2) Cumartesi ve Pazar programlarını sil
DELETE FROM doctor_schedules 
WHERE EXTRACT(DOW FROM schedule_date) IN (0, 6); -- 0=Pazar, 6=Cumartesi

-- 3) Mevcut tüm programları sil (temiz başlayalım)
DELETE FROM doctor_schedules;

-- 4) Ocak 2026 için hafta içi günlerde boş programlar oluştur
INSERT INTO doctor_schedules (doctor_id, schedule_date, start_time, end_time, is_available, slot_duration, notes)
SELECT 
  '8d8e6b45-ed47-4e79-be36-5f1bce4203e6'::uuid as doctor_id, -- Prof. Dr. Eray Çalışkan
  date::date as schedule_date,
  '09:00:00'::time as start_time,
  '18:00:00'::time as end_time,
  true as is_available,
  15 as slot_duration,
  null as notes
FROM generate_series(
  '2026-01-01'::date,  -- Ocak başı
  '2026-01-31'::date,  -- Ocak sonu
  '1 day'::interval
) as date
WHERE EXTRACT(DOW FROM date) BETWEEN 1 AND 5  -- Sadece Pazartesi(1) - Cuma(5)
ON CONFLICT (doctor_id, schedule_date) DO NOTHING;
