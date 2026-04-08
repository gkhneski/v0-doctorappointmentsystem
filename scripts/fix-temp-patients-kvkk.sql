-- Hızlı ajandadan girilen (TEMP TC veya placeholder telefon) hastaların KVKK onayını kaldır
-- Bu hastalar henüz gerçek onay vermedi

UPDATE patients
SET 
  kvkk_approved = false,
  kvkk_approved_at = NULL,
  kvkk_approved_via = NULL
WHERE 
  tc_no LIKE 'TEMP_%' 
  OR phone = '0000000000';
