-- Phase 1: Critical Database Fixes

-- 1. payment_done column silinmesi (pregnancy_visits tablosundan)
ALTER TABLE pregnancy_visits DROP COLUMN IF EXISTS payment_done;

-- 2. pre_weight_kg → pre_pregnancy_weight rename (pregnancy_episodes tablosunda)
ALTER TABLE pregnancy_episodes 
RENAME COLUMN pre_weight_kg TO pre_pregnancy_weight;

-- 3. Legacy tablo silmesi
DROP TABLE IF EXISTS doctor_schedules_old CASCADE;

-- Optimization: İndeks kontrolü
-- pre_pregnancy_weight üzerine index ekle (sık sorgulanacak)
CREATE INDEX IF NOT EXISTS idx_pregnancy_episodes_pre_pregnancy_weight 
ON pregnancy_episodes(pre_pregnancy_weight);

-- Istatistik güncelle
ANALYZE pregnancy_episodes;
ANALYZE pregnancy_visits;
