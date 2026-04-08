-- Ayrıntılı fetal ultrason için bebek sayısı (tek/ikiz/üçüz)
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS fetal_bebek_sayisi TEXT DEFAULT NULL;
