-- Ara slot randevuları için is_intermediate kolonu ekle
-- Bu randevular sadece admin panelinde görünür, hastalara gösterilmez

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS is_intermediate BOOLEAN DEFAULT FALSE;

-- Mevcut randevuları normal olarak işaretle
UPDATE appointments SET is_intermediate = FALSE WHERE is_intermediate IS NULL;

-- Index ekle (filtreleme için)
CREATE INDEX IF NOT EXISTS idx_appointments_is_intermediate ON appointments(is_intermediate);

-- Comment ekle
COMMENT ON COLUMN appointments.is_intermediate IS 'Ara slot randevuları - hastalara görünmez, sadece admin panelinde görünür';
