-- Create message_templates table
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reminder', 'document_request', 'test_request', 'appointment', 'general')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sent_messages table
CREATE TABLE IF NOT EXISTS sent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
  message_content TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'sms', 'email')),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'pending')),
  sent_by UUID NOT NULL REFERENCES admin_users(id),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_templates
CREATE POLICY "Admin can view templates" ON message_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can insert templates" ON message_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin can update templates" ON message_templates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete templates" ON message_templates FOR DELETE TO authenticated USING (true);

-- RLS Policies for sent_messages
CREATE POLICY "Admin can view sent messages" ON sent_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can insert sent messages" ON sent_messages FOR INSERT TO authenticated WITH CHECK (true);

-- Insert default templates
INSERT INTO message_templates (name, content, type) VALUES
  ('Eksik Evrak Hatırlatma', 'Merhaba {hasta_adi}, {doktor_adi} tarafından tedaviniz için eksik evrakların tamamlanması gerekmektedir. En kısa sürede kliniğimize başvurmanızı rica ederiz.', 'document_request'),
  ('Tahlil Sonucu', 'Sayın {hasta_adi}, tahlil sonuçlarınız hazır. Lütfen kliniğimizle iletişime geçiniz.', 'test_request'),
  ('Randevu Hatırlatma', 'Merhaba {hasta_adi}, {tarih} tarihinde saat {saat} randevunuz bulunmaktadır. Teşekkür ederiz.', 'appointment'),
  ('Genel Bilgilendirme', 'Sayın {hasta_adi}, tedaviniz ile ilgili bilgilendirme: {mesaj}', 'general');

-- Create indexes
CREATE INDEX idx_sent_messages_patient ON sent_messages(patient_id);
CREATE INDEX idx_sent_messages_sent_at ON sent_messages(sent_at DESC);
CREATE INDEX idx_message_templates_type ON message_templates(type);
