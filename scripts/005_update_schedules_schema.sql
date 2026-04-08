-- Tarih bazlı program sistemi için yeni tablo yapısı

-- Eski tabloyu yedekle
ALTER TABLE doctor_schedules RENAME TO doctor_schedules_old;

-- Yeni tablo oluştur - tarih ve saat bazlı
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration INTEGER DEFAULT 15, -- dakika cinsinden
  is_available BOOLEAN DEFAULT true,
  notes TEXT, -- "Ameliyat listesi var" gibi notlar için
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler ekle
CREATE INDEX idx_schedules_date ON doctor_schedules(schedule_date);
CREATE INDEX idx_schedules_doctor_date ON doctor_schedules(doctor_id, schedule_date);

-- RLS politikalarını kopyala
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedules_select_all"
  ON public.doctor_schedules FOR SELECT
  USING (true);

CREATE POLICY "schedules_insert_admin"
  ON public.doctor_schedules FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "schedules_update_admin"
  ON public.doctor_schedules FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "schedules_delete_admin"
  ON public.doctor_schedules FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Önümüzdeki 2 hafta için varsayılan program oluştur (Pazartesi-Cuma, 09:00-18:00)
INSERT INTO public.doctor_schedules (doctor_id, schedule_date, start_time, end_time, is_available)
SELECT 
  d.id,
  date_val,
  '09:00:00'::TIME,
  '18:00:00'::TIME,
  true
FROM public.doctors d
CROSS JOIN (
  SELECT generate_series(
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '14 days',
    '1 day'::interval
  )::DATE as date_val
) dates
WHERE EXTRACT(DOW FROM date_val) BETWEEN 1 AND 5; -- Pazartesi-Cuma

-- Eski tabloyu silmek isterseniz:
-- DROP TABLE doctor_schedules_old CASCADE;
