-- 2027 yılının tüm randevu programını TEK SEFERDE aç, resmi tatilleri kapalı işaretle
-- Pazartesi (1), Çarşamba (3), Cuma (5): 11:30 - 17:30
-- Salı (2), Perşembe (4):                13:30 - 17:30
-- Hafta sonu açılmaz. end_time son randevu saatidir (17:30 slotu dahil).
--
-- Resmi tatiller de kayıt olarak eklenir ama is_available = false (kapalı) gelir;
-- sekreter admin panelinden istediği günü açıp kapatabilir.
--
-- TEK SEFERLİK: 2027'de zaten kaydı olan hafta içi günleri de bu saatlere çeker ve açar
-- (Ocak 2027'de 09:00-18:00 / kapalı olarak duran 21 kayıt vardı). Tekrar çalıştırılırsa
-- sekreterin 2027'de elle yaptığı aç/kapa ve saat değişiklikleri sıfırlanır.

BEGIN;

CREATE TEMP TABLE tatiller_2027 (tarih date PRIMARY KEY, ad text NOT NULL) ON COMMIT DROP;

-- Sadece hafta içine denk gelenler (1 Mayıs Cumartesi, Kurban arifesi ve 1. günü hafta sonu)
INSERT INTO tatiller_2027 (tarih, ad) VALUES
  ('2027-01-01', 'Resmi tatil: Yılbaşı'),
  ('2027-03-08', 'Resmi tatil: Ramazan Bayramı arifesi (öğleden sonra)'),
  ('2027-03-09', 'Resmi tatil: Ramazan Bayramı 1. gün'),
  ('2027-03-10', 'Resmi tatil: Ramazan Bayramı 2. gün'),
  ('2027-03-11', 'Resmi tatil: Ramazan Bayramı 3. gün'),
  ('2027-04-23', 'Resmi tatil: 23 Nisan Ulusal Egemenlik ve Çocuk Bayramı'),
  ('2027-05-17', 'Resmi tatil: Kurban Bayramı 2. gün'),
  ('2027-05-18', 'Resmi tatil: Kurban Bayramı 3. gün'),
  ('2027-05-19', 'Resmi tatil: Kurban Bayramı 4. gün / 19 Mayıs'),
  ('2027-07-15', 'Resmi tatil: 15 Temmuz Demokrasi ve Milli Birlik Günü'),
  ('2027-08-30', 'Resmi tatil: 30 Ağustos Zafer Bayramı'),
  ('2027-10-28', 'Resmi tatil: Cumhuriyet Bayramı arifesi (öğleden sonra)'),
  ('2027-10-29', 'Resmi tatil: 29 Ekim Cumhuriyet Bayramı');

-- 1) Zaten kaydı olan 2027 hafta içi günlerini standart saatlere çek, tatil değilse aç
UPDATE doctor_schedules s
SET start_time = CASE WHEN EXTRACT(DOW FROM s.schedule_date) IN (1, 3, 5) THEN '11:30'::time ELSE '13:30'::time END,
    end_time = '17:30'::time,
    slot_duration = 15,
    is_available = NOT EXISTS (SELECT 1 FROM tatiller_2027 t WHERE t.tarih = s.schedule_date),
    is_active = true,
    notes = (SELECT t.ad FROM tatiller_2027 t WHERE t.tarih = s.schedule_date),
    updated_at = NOW()
WHERE s.doctor_id = '8d8e6b45-ed47-4e79-be36-5f1bce4203e6'
  AND s.schedule_date BETWEEN '2027-01-01' AND '2027-12-31'
  AND EXTRACT(DOW FROM s.schedule_date) BETWEEN 1 AND 5;

-- 2) Eksik tüm hafta içi günlerini ekle (tatiller kapalı olarak)
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
  g.day::date,
  CASE WHEN EXTRACT(DOW FROM g.day) IN (1, 3, 5) THEN '11:30'::time ELSE '13:30'::time END,
  '17:30'::time,
  15,
  t.tarih IS NULL,
  true,
  t.ad
FROM doctors d
CROSS JOIN generate_series('2027-01-01'::date, '2027-12-31'::date, '1 day'::interval) AS g(day)
LEFT JOIN tatiller_2027 t ON t.tarih = g.day::date
WHERE d.id = '8d8e6b45-ed47-4e79-be36-5f1bce4203e6' -- Prof. Dr. Eray Çalışkan
  AND EXTRACT(DOW FROM g.day) BETWEEN 1 AND 5
  AND NOT EXISTS (
    SELECT 1
    FROM doctor_schedules s
    WHERE s.doctor_id = d.id
      AND s.schedule_date = g.day::date
  );

COMMIT;

-- Kontrol 1: toplam 261 gün, 248 açık, 13 kapalı görünmeli
SELECT
  EXTRACT(DOW FROM schedule_date) AS gun_no,
  TRIM(TO_CHAR(schedule_date, 'Day')) AS gun,
  COUNT(*) AS gun_sayisi,
  COUNT(*) FILTER (WHERE is_available) AS acik_gun,
  COUNT(*) FILTER (WHERE NOT is_available) AS kapali_gun,
  MIN(start_time) AS en_erken_baslangic,
  MAX(start_time) AS en_gec_baslangic,
  MIN(end_time) AS en_erken_bitis,
  MAX(end_time) AS en_gec_bitis
FROM doctor_schedules
WHERE doctor_id = '8d8e6b45-ed47-4e79-be36-5f1bce4203e6'
  AND schedule_date BETWEEN '2027-01-01' AND '2027-12-31'
GROUP BY 1, 2
ORDER BY 1;

-- Kontrol 2: kapalı günlerin listesi
SELECT schedule_date AS tarih, TRIM(TO_CHAR(schedule_date, 'Day')) AS gun, notes AS neden
FROM doctor_schedules
WHERE doctor_id = '8d8e6b45-ed47-4e79-be36-5f1bce4203e6'
  AND schedule_date BETWEEN '2027-01-01' AND '2027-12-31'
  AND NOT is_available
ORDER BY schedule_date;
