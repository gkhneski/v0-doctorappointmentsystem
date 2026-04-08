-- Fix message_templates type constraint to include SMS

-- First, delete any rows with invalid types or update them
UPDATE message_templates 
SET type = 'sms' 
WHERE type NOT IN ('whatsapp', 'email');

-- Drop the old constraint
ALTER TABLE message_templates 
DROP CONSTRAINT IF EXISTS message_templates_type_check;

-- Add new constraint that includes 'sms'
ALTER TABLE message_templates 
ADD CONSTRAINT message_templates_type_check 
CHECK (type IN ('sms', 'whatsapp', 'email'));

-- Verify the change
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'message_templates_type_check';
