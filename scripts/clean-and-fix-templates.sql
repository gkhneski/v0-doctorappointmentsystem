-- Clean message_templates and fix constraint

-- Step 1: Delete all rows (fresh start)
DELETE FROM message_templates;

-- Step 2: Drop the constraint
ALTER TABLE message_templates 
DROP CONSTRAINT IF EXISTS message_templates_type_check;

-- Step 3: Add new constraint with SMS
ALTER TABLE message_templates 
ADD CONSTRAINT message_templates_type_check 
CHECK (type IN ('sms', 'whatsapp', 'email'));

-- Step 4: Insert default SMS templates
INSERT INTO message_templates (name, content, type) VALUES
('Randevu Hatırlatma', 'Sayın {isim}, yarınki randevunuzu hatırlatmak isteriz. Dr. Eray Çalışkan', 'sms'),
('Eksik Evrak', 'Sayın {isim}, evraklarınız eksik. Lütfen en kısa sürede tamamlayınız. Dr. Eray Çalışkan', 'sms'),
('Tahlil Sonucu', 'Sayın {isim}, tahlil sonuçlarınız hazır. Görüşmek için arayabilirsiniz. Dr. Eray Çalışkan', 'sms');
