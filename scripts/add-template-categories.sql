-- Add category field to message_templates
ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general';
ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS is_list BOOLEAN DEFAULT false;

-- Create index
CREATE INDEX IF NOT EXISTS idx_message_templates_category ON message_templates(category);

-- Insert default list templates
INSERT INTO message_templates (name, content, type, category, is_list) VALUES
  ('İlaç Listesi', 'İlaçlarınız: {liste}', 'sms', 'medication', true),
  ('Vitamin Listesi', 'Vitaminleriniz: {liste}', 'sms', 'vitamin', true),
  ('Tahlil Listesi', 'Yaptırmanız gereken tahliller: {liste}', 'sms', 'test', true)
ON CONFLICT DO NOTHING;

-- Add comment
COMMENT ON COLUMN message_templates.category IS 'Şablon kategorisi: general, medication, vitamin, test, reminder';
COMMENT ON COLUMN message_templates.is_list IS 'Bu şablon liste tipinde mi (çoklu seçim için)';
