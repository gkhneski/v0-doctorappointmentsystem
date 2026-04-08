-- Hafta içi her gün (Pazartesi-Cuma) 09:00-18:00 arası programlar
-- day_of_week: 0=Pazartesi, 1=Salı, 2=Çarşamba, 3=Perşembe, 4=Cuma, 5=Cumartesi, 6=Pazar

INSERT INTO public.doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_available)
SELECT 
  d.id,
  dow,
  '09:00:00'::TIME,
  '18:00:00'::TIME,
  true
FROM public.doctors d
CROSS JOIN generate_series(0, 4) AS dow  -- 0-4: Pazartesi-Cuma
ON CONFLICT (doctor_id, day_of_week) DO UPDATE
SET start_time = '09:00:00'::TIME,
    end_time = '18:00:00'::TIME,
    is_available = true;
