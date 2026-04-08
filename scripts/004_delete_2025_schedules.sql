-- 2025 ve öncesi tarihli tüm programları ve randevuları sil
DELETE FROM appointments WHERE appointment_date < '2026-01-01';
DELETE FROM doctor_schedules WHERE schedule_date < '2026-01-01';

-- 1 Ocak 2026'dan itibaren başlayacak şekilde ayarla
-- (Programlar zaten 1 Ocak 2026'dan başlıyor olmalı)
