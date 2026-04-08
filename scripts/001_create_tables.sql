-- Create doctors table
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create patients table with user reference
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE,
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
  reason TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admin_users table for admin authentication
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  is_super_admin BOOLEAN DEFAULT false,
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
  UNIQUE(doctor_id, day_of_week)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patients table
CREATE POLICY "patients_select_own"
  ON public.patients FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "patients_insert_own"
  ON public.patients FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "patients_update_own"
  ON public.patients FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for appointments table
CREATE POLICY "appointments_select_own"
  ON public.appointments FOR SELECT
  USING (
    patient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );

CREATE POLICY "appointments_insert_own"
  ON public.appointments FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "appointments_update_own"
  ON public.appointments FOR UPDATE
  USING (
    patient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );

CREATE POLICY "appointments_delete_own"
  ON public.appointments FOR DELETE
  USING (
    patient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );

-- RLS Policies for doctors table (public read, admin write)
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

-- RLS Policies for doctor_schedules (public read, admin write)
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

-- RLS Policies for admin_users (admin only)
CREATE POLICY "admin_users_select_admin"
  ON public.admin_users FOR SELECT
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid() AND is_super_admin = true));

CREATE POLICY "admin_users_insert_admin"
  ON public.admin_users FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid() AND is_super_admin = true));
