-- Performance indexes for the most queried columns
-- appointments table: most frequent queries are by date, doctor, status
CREATE INDEX IF NOT EXISTS idx_appointments_date
  ON appointments (appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date
  ON appointments (doctor_id, appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date_time
  ON appointments (doctor_id, appointment_date, appointment_time);

CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON appointments (status);

CREATE INDEX IF NOT EXISTS idx_appointments_patient
  ON appointments (patient_id);

-- patients table: TC no and phone are used in every booking pre-check
CREATE INDEX IF NOT EXISTS idx_patients_tc_no
  ON patients (tc_no);

CREATE INDEX IF NOT EXISTS idx_patients_phone
  ON patients (phone);

CREATE INDEX IF NOT EXISTS idx_patients_blacklisted
  ON patients (is_blacklisted)
  WHERE is_blacklisted = true;

-- doctor_schedules: queried by date range constantly
CREATE INDEX IF NOT EXISTS idx_schedules_doctor_date
  ON doctor_schedules (doctor_id, schedule_date);

CREATE INDEX IF NOT EXISTS idx_schedules_date_available
  ON doctor_schedules (schedule_date, is_available);

-- sms_verifications: looked up by appointment_id on every verify call
CREATE INDEX IF NOT EXISTS idx_sms_verifications_appointment
  ON sms_verifications (appointment_id);

-- No-show risk analysis: query appointments by patient + status
CREATE INDEX IF NOT EXISTS idx_appointments_patient_status
  ON appointments (patient_id, status);
