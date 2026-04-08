-- Tek kullanımlık randevu erişim token'ları
CREATE TABLE IF NOT EXISTS appointment_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(255) UNIQUE NOT NULL,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_appointment_access_tokens_token ON appointment_access_tokens(token);
CREATE INDEX idx_appointment_access_tokens_appointment ON appointment_access_tokens(appointment_id);

-- Randevu bazlı form cevapları
CREATE TABLE IF NOT EXISTS appointment_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_appointment_forms_appointment ON appointment_forms(appointment_id);

-- RLS Policies
ALTER TABLE appointment_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_forms ENABLE ROW LEVEL SECURITY;

-- Token'lar herkese okunabilir (validation için)
CREATE POLICY "Tokens are publicly readable for validation"
  ON appointment_access_tokens FOR SELECT
  TO anon, authenticated
  USING (used_at IS NULL AND expires_at > now());

-- Service role her şeyi yapabilir
CREATE POLICY "Service role can manage tokens"
  ON appointment_access_tokens FOR ALL
  TO service_role
  USING (true);

-- Formlar sadece service role tarafından yönetilebilir
CREATE POLICY "Service role can manage forms"
  ON appointment_forms FOR ALL
  TO service_role
  USING (true);

-- Admin formları okuyabilir
CREATE POLICY "Admin can view forms"
  ON appointment_forms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

COMMENT ON TABLE appointment_access_tokens IS 'Tek kullanımlık randevu erişim linkleri';
COMMENT ON TABLE appointment_forms IS 'Randevu bazlı hasta form cevapları';
