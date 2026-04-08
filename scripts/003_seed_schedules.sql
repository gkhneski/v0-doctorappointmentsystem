-- Insert sample schedules for doctors (Monday-Friday, 9 AM - 5 PM)
INSERT INTO public.doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_available)
SELECT 
  d.id,
  dow,
  '09:00:00'::TIME,
  '17:00:00'::TIME,
  true
FROM public.doctors d
CROSS JOIN generate_series(1, 5) AS dow
ON CONFLICT (doctor_id, day_of_week) DO NOTHING;
