-- Insert sample doctors
INSERT INTO public.doctors (name, specialization, email, phone) VALUES
  ('Dr. Sarah Johnson', 'Cardiologist', 'sarah.johnson@hospital.com', '555-0101'),
  ('Dr. Michael Chen', 'Pediatrician', 'michael.chen@hospital.com', '555-0102'),
  ('Dr. Emily Williams', 'Dermatologist', 'emily.williams@hospital.com', '555-0103'),
  ('Dr. James Brown', 'Orthopedic Surgeon', 'james.brown@hospital.com', '555-0104'),
  ('Dr. Lisa Anderson', 'General Practitioner', 'lisa.anderson@hospital.com', '555-0105')
ON CONFLICT (email) DO NOTHING;
