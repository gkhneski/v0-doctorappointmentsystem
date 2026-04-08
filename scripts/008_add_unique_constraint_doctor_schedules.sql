-- Add unique constraint to doctor_schedules table for (doctor_id, schedule_date)
-- This allows upsert operations and prevents duplicate schedules

ALTER TABLE doctor_schedules
ADD CONSTRAINT doctor_schedules_doctor_date_unique
UNIQUE (doctor_id, schedule_date);

-- Verify the constraint was added
SELECT
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'doctor_schedules'
  AND constraint_type = 'UNIQUE';
