-- patients tablosuna KVKK onay zaman damgası ekle
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS kvkk_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS kvkk_approved_via text; -- 'wizard' veya 'sms'

-- Zaten kvkk_approved=true olan kayıtlar için geriye dönük doldur
UPDATE patients
SET kvkk_approved_at = created_at,
    kvkk_approved_via = 'wizard'
WHERE kvkk_approved = true AND kvkk_approved_at IS NULL;
