-- Add working hours to doctors table
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{
  "monday": {"enabled": true, "start": "11:30", "end": "17:45"},
  "tuesday": {"enabled": true, "start": "13:30", "end": "17:45"},
  "wednesday": {"enabled": true, "start": "11:30", "end": "17:45"},
  "thursday": {"enabled": true, "start": "13:30", "end": "17:45"},
  "friday": {"enabled": true, "start": "11:30", "end": "17:45"},
  "saturday": {"enabled": false, "start": "09:00", "end": "17:00"},
  "sunday": {"enabled": false, "start": "09:00", "end": "17:00"}
}'::jsonb;

-- Update existing doctors with default working hours
UPDATE doctors 
SET working_hours = '{
  "monday": {"enabled": true, "start": "11:30", "end": "17:45"},
  "tuesday": {"enabled": true, "start": "13:30", "end": "17:45"},
  "wednesday": {"enabled": true, "start": "11:30", "end": "17:45"},
  "thursday": {"enabled": true, "start": "13:30", "end": "17:45"},
  "friday": {"enabled": true, "start": "11:30", "end": "17:45"},
  "saturday": {"enabled": false, "start": "09:00", "end": "17:00"},
  "sunday": {"enabled": false, "start": "09:00", "end": "17:00"}
}'::jsonb
WHERE working_hours IS NULL;
