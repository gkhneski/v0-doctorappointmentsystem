-- SMS doğrulama kodları tablosu
CREATE TABLE IF NOT EXISTS sms_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_sms_verifications_phone ON sms_verifications(phone);
CREATE INDEX idx_sms_verifications_appointment ON sms_verifications(appointment_id);
CREATE INDEX idx_sms_verifications_code ON sms_verifications(code);

-- RLS Politikaları
ALTER TABLE sms_verifications ENABLE ROW LEVEL SECURITY;

-- Admin kullanıcıları tüm verileri görebilir
CREATE POLICY "Admin users can view all sms verifications"
  ON sms_verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Sistem SMS kaydı oluşturabilir (server-side)
CREATE POLICY "System can create sms verifications"
  ON sms_verifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Sistem doğrulama güncelleyebilir
CREATE POLICY "System can update sms verifications"
  ON sms_verifications FOR UPDATE
  TO authenticated
  USING (true);

COMMENT ON TABLE sms_verifications IS 'SMS doğrulama kodları ve randevu onayları için kullanılır';
