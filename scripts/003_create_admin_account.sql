-- Bu dosyadaki eski giriş bilgileri git geçmişinde durduğu için GEÇERSİZ sayılmalıdır; şifreler değiştirilmelidir.
-- Admin kullanıcı hesabı oluşturma scripti
-- Email: <E-POSTA>
-- Şifre: <ŞİFRE — depoya yazmayın>
-- Not: Bu scripti çalıştırmadan önce lütfen /auth/admin/signup sayfasından kayıt olun

-- Bu script otomatik şifre oluşturamaz çünkü Supabase Auth kullanıyoruz
-- Lütfen tarayıcınızdan /auth/admin/signup adresine gidin ve şu bilgilerle kayıt olun:
-- 
-- Ad Soyad: Prof. Dr. Eray Çalışkan
-- E-posta: <E-POSTA>
-- Şifre: <ŞİFRE — depoya yazmayın>
-- Rol: Doktor

-- Alternatif: Eğer Supabase Dashboard'dan direkt auth.users tablosuna kullanıcı eklediyseniz,
-- aşağıdaki komutu admin_users tablosuna eklemek için kullanabilirsiniz:

-- INSERT INTO public.admin_users (id, email, full_name, role)
-- SELECT id, email, 'Prof. Dr. Eray Çalışkan', 'doktor'
-- FROM auth.users
-- WHERE email = '<E-POSTA>'
-- ON CONFLICT (id) DO NOTHING;
