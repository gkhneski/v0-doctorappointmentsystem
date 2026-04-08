-- Randevu Hatırlatma SMS şablonunu ekle
-- Önce varsa sil
DELETE FROM message_templates WHERE name = 'Randevu Hatırlatma SMS';

-- Şablonu ekle
INSERT INTO message_templates (name, content, type, category, is_list, created_at, updated_at)
VALUES (
  'Randevu Hatırlatma SMS',
  'Merhaba {isim},

Yarınki randevunuzu hatırlatmak isteriz.
Tarih: {tarih}
Saat: {saat}

Getirmeniz gereken evraklar:
{evraklar}

Randevunuza gelip gelmeyeceğinizi lütfen bildirin:
https://www.dreraycaliskan.com/confirm/{token}

Prof. Dr. Eray Çalışkan
Kadın Hastalıkları ve Doğum Uzmanı',
  'sms',
  'reminder',
  false,
  NOW(),
  NOW()
);
