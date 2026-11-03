-- Eski yazdirma tipi yazimlarini ("det kontrol", "OP sonrasi kontrol" vb.)
-- lib/print-types.ts icindeki Turkce karsiliklarina cevirir.
-- Buyuk/kucuk harf ve Turkce karakter farki yok sayilarak eslesir.

WITH canonical(value) AS (
  VALUES
    ('IVF kontrol'), ('IUI kontrol'), ('DET kontrol'), ('Endom kontrol'), ('Klomen takip'),
    ('OP sonrası kontrol'), ('Serklaj sonrası kontrol'), ('Sonuç'), ('G.M'), ('DTY'),
    ('Gebelik istemi'), ('Mens'), ('Mens IUI'), ('Mens IVF'), ('Mens DET'),
    ('Gebe kontrol'), ('Gebe muayene'), ('Negatif IVF'), ('Negatif IUI'), ('D21'),
    ('Kontrol'), ('Amniyosentez sonrası k.'), ('Kürtaj sonrası k.'), ('OHSS kontrol'),
    ('Kese kontrol'), ('C/S sonrası kontrol'), ('Kist kontrol'), ('Akıntı kontrol'),
    ('No mens'), ('İşlem')
),
keyed AS (
  SELECT value, lower(translate(value, 'ıİşŞçÇğĞüÜöÖ', 'iissccgguuoo')) AS k FROM canonical
  UNION ALL
  SELECT 'Amniyosentez sonrası k.', 'amniosentez sonrasi k.'
)
UPDATE appointments a
SET print_type = keyed.value
FROM keyed
WHERE lower(translate(trim(a.print_type), 'ıİşŞçÇğĞüÜöÖ', 'iissccgguuoo')) = keyed.k
  AND a.print_type IS DISTINCT FROM keyed.value;
