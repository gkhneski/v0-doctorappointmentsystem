-- Cumartesi ve Pazar kayıtlarını sil
DELETE FROM doctor_schedules 
WHERE EXTRACT(DOW FROM schedule_date) IN (0, 6); -- 0=Pazar, 6=Cumartesi

-- Ocak 2026'dan önceki tüm kayıtları sil
DELETE FROM doctor_schedules 
WHERE schedule_date < '2026-01-01';

-- Kontrol: Sadece Pazartesi-Cuma kayıtları kalsın
-- Kalan kayıtları kontrol et
SELECT schedule_date, 
       EXTRACT(DOW FROM schedule_date) as day_of_week,
       to_char(schedule_date, 'Day') as day_name
FROM doctor_schedules 
ORDER BY schedule_date;
