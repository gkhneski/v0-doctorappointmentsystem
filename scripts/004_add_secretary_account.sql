-- Bu dosyadaki eski giriş bilgileri git geçmişinde durduğu için GEÇERSİZ sayılmalıdır; şifreler değiştirilmelidir.
-- Sekreter hesabı için admin_users kaydı
-- NOT: Önce Supabase Auth'dan <E-POSTA> ile kayıt olun
-- Sonra aşağıdaki komutu çalıştırın ve USER_ID'yi değiştirin

-- Kullanıcı ID'sini buraya yazın (Supabase Auth Users tablosundan alın)
-- INSERT INTO admin_users (id, email, full_name, role)
-- VALUES ('<USER_ID>', '<E-POSTA>', '<AD SOYAD>', 'sekreter');

-- Alternatif: Eğer trigger çalışıyorsa, sadece signup sayfasından kayıt olun:
-- Email: <E-POSTA>
-- Şifre: <ŞİFRE — depoya yazmayın>
-- Rol: Sekreter
