-- Simply drop and recreate the constraint to include SMS

-- Drop the existing constraint
ALTER TABLE message_templates 
DROP CONSTRAINT message_templates_type_check;

-- Add new constraint with SMS included
ALTER TABLE message_templates 
ADD CONSTRAINT message_templates_type_check 
CHECK (type IN ('sms', 'whatsapp', 'email'));
