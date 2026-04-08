-- Add new pregnancy tests and documents to predefined lists
INSERT INTO predefined_lists (name, category, items) VALUES
  (
    'Hamilelik Tahlilleri ve Evrakları', 
    'test', 
    ARRAY[
      'İkili Test',
      'Dörtlü Test',
      'Üçlü Test',
      'Fetal DNA Testi',
      'Şeker Yüklemesi Tahlili',
      'Önceki Ultrason Görüntüleriniz',
      'Ailede Genetik Hastalık Varsa Raporları',
      'Tiroid Hastalığı Varsa Tahlilleri',
      'Şeker/Tansiyon Varsa Takip Kağıtları',
      'Önceki Ameliyat Raporları'
    ]
  );
