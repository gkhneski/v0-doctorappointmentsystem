-- Add link_clicked_at column to appointments table
-- This tracks when the patient clicked on the confirmation link

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS link_clicked_at TIMESTAMP WITH TIME ZONE;

-- Add comment
COMMENT ON COLUMN appointments.link_clicked_at IS 'Timestamp when patient clicked the SMS confirmation link';
