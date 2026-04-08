-- Adım 1: Tüm randevuları sil
DELETE FROM appointments;

-- Adım 2: Tüm programları sil
DELETE FROM doctor_schedules;

-- Adım 3: Ocak 2026 için sadece iş günlerinde programlar oluştur
-- Pazartesi 6 Ocak 2026
INSERT INTO doctor_schedules (doctor_id, schedule_date, is_active, start_time, end_time)
VALUES ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-06', true, '09:00', '18:00');

-- Salı 7 Ocak 2026
INSERT INTO doctor_schedules (doctor_id, schedule_date, is_active, start_time, end_time)
VALUES ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-07', true, '09:00', '18:00');

-- Çarşamba 8 Ocak 2026
INSERT INTO doctor_schedules (doctor_id, schedule_date, is_active, start_time, end_time)
VALUES ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-08', true, '09:00', '18:00');

-- Perşembe 9 Ocak 2026
INSERT INTO doctor_schedules (doctor_id, schedule_date, is_active, start_time, end_time)
VALUES ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-09', true, '09:00', '18:00');

-- Cuma 10 Ocak 2026
INSERT INTO doctor_schedules (doctor_id, schedule_date, is_active, start_time, end_time)
VALUES ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-10', true, '09:00', '18:00');

-- Pazartesi 13 Ocak 2026
INSERT INTO doctor_schedules (doctor_id, schedule_date, is_active, start_time, end_time)
VALUES ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-13', true, '09:00', '18:00');

-- Salı 14 Ocak 2026
INSERT INTO doctor_schedules (doctor_id, schedule_date, is_active, start_time, end_time)
VALUES ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-14', true, '09:00', '18:00');

-- Çarşamba 15 Ocak 2026
INSERT INTO doctor_schedules (doctor_id, schedule_date, is_active, start_time, end_time)
VALUES ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-15', true, '09:00', '18:00');

-- Perşembe 16 Ocak 2026
INSERT INTO doctor_schedules (doctor_id, schedule_date, is_active, start_time, end_time)
VALUES ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-16', true, '09:00', '18:00');

-- Cuma 17 Ocak 2026
INSERT INTO doctor_schedules (doctor_id, schedule_date, is_active, start_time, end_time)
VALUES ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-17', true, '09:00', '18:00');

-- Pazartesi 20 Ocak 2026
INSERT INTO doctor_schedules (doctor_id, schedule_date, is_active, start_time, end_time)
VALUES ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-20', true, '09:00', '18:00');

-- Salı 21 Ocak 2026
INSERT INTO doctor_schedules (doctor_id, schedule_date, is_active, start_time, end_time)
VALUES ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-21', true, '09:00', '18:00');

-- Çarşamba 22 Ocak 2026
INSERT INTO doctor_schedules (doctor_id, schedule_date, is_active, start_time, end_time)
VALUES ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-22', true, '09:00', '18:00');

-- Perşembe 23 Ocak 2026
INSERT INTO doctor_schedules (doctor_id, schedule_date, is_active, start_time, end_time)
VALUES ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-23', true, '09:00', '18:00');

-- Cuma 24 Ocak 2026
INSERT INTO doctor_schedules (doctor_id, schedule_date, is_active, start_time, end_time)
VALUES ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-24', true, '09:00', '18:00');

-- Pazartesi 27 Ocak 2026
INSERT INTO doctor_schedules (doctor_id, schedule_date, is_active, start_time, end_time)
VALUES ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-27', true, '09:00', '18:00');

-- Salı 28 Ocak 2026
INSERT INTO doctor_schedules (doctor_id, schedule_date, is_active, start_time, end_time)
VALUES ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-28', true, '09:00', '18:00');

-- Çarşamba 29 Ocak 2026
INSERT INTO doctor_schedules (doctor_id, schedule_date, is_active, start_time, end_time)
VALUES ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-29', true, '09:00', '18:00');

-- Perşembe 30 Ocak 2026
INSERT INTO doctor_schedules (doctor_id, schedule_date, is_active, start_time, end_time)
VALUES ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-30', true, '09:00', '18:00');

-- Cuma 31 Ocak 2026
INSERT INTO doctor_schedules (doctor_id, schedule_date, is_active, start_time, end_time)
VALUES ('8d8e6b45-ed47-4e79-be36-5f1bce4203e6', '2026-01-31', true, '09:00', '18:00');

-- Kontrol sorgusu: Sadece iş günleri olmalı
SELECT 
  schedule_date,
  TO_CHAR(schedule_date, 'Day') as gun_adi,
  EXTRACT(DOW FROM schedule_date) as gun_numarasi
FROM doctor_schedules
WHERE schedule_date >= '2026-01-01'
ORDER BY schedule_date;
