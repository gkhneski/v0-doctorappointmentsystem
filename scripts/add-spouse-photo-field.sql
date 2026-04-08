-- Add spouse_photo_url field to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS spouse_photo_url TEXT;
