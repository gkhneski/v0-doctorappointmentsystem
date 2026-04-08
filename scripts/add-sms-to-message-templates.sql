-- Add 'sms' to message_templates type constraint
-- This allows SMS templates alongside WhatsApp and email templates

-- Drop existing constraint
ALTER TABLE message_templates DROP CONSTRAINT IF EXISTS message_templates_type_check;

-- Add new constraint with SMS support
ALTER TABLE message_templates ADD CONSTRAINT message_templates_type_check 
CHECK (type IN ('whatsapp', 'email', 'sms'));
