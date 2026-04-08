-- Drop existing tables and policies
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.doctor_schedules CASCADE;
DROP TABLE IF EXISTS public.doctors CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- Create doctors table
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create patients table (üyeliksiz - sadece bilgi saklama)
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tc_no TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  kvkk_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admin_users table for admin authentication
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'sekreter' CHECK (role IN ('doktor', 'sekreter')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create doctor_schedules table for availability management
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, day_of_week, start_time)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patients table (herkes ekleyebilir, sadece admin okuyabilir)
CREATE POLICY "patients_insert_all"
  ON public.patients FOR INSERT
  WITH CHECK (true);

CREATE POLICY "patients_select_admin"
  ON public.patients FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- RLS Policies for appointments table (herkes ekleyebilir, sadece admin yönetebilir)
CREATE POLICY "appointments_insert_all"
  ON public.appointments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "appointments_select_admin"
  ON public.appointments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "appointments_update_admin"
  ON public.appointments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "appointments_delete_admin"
  ON public.appointments FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- RLS Policies for doctors table (herkes okuyabilir, admin yönetebilir)
CREATE POLICY "doctors_select_all"
  ON public.doctors FOR SELECT
  USING (true);

CREATE POLICY "doctors_insert_admin"
  ON public.doctors FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "doctors_update_admin"
  ON public.doctors FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "doctors_delete_admin"
  ON public.doctors FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- RLS Policies for doctor_schedules (herkes okuyabilir, admin yönetebilir)
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

-- RLS Policies for admin_users (sadece admin)
CREATE POLICY "admin_users_select_admin"
  ON public.admin_users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "admin_users_insert_admin"
  ON public.admin_users FOR INSERT
  WITH CHECK (auth.uid() = id);
