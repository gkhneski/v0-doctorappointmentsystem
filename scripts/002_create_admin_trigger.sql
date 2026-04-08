-- Admin kullanıcılar için trigger oluştur
-- Bu trigger, auth.users tablosuna yeni kullanıcı eklendiğinde
-- eğer kullanıcının metadata'sında role varsa admin_users tablosuna ekler

CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has admin role in metadata
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    INSERT INTO public.admin_users (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      COALESCE(NEW.raw_user_meta_data->>'role', 'sekreter')
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger'ı oluştur
DROP TRIGGER IF EXISTS on_auth_user_created_check_admin ON auth.users;

CREATE TRIGGER on_auth_user_created_check_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_admin_user();

-- Manuel admin ekleme örneği:
-- INSERT INTO public.admin_users (id, email, full_name, role)
-- VALUES ('user-uuid-here', 'admin@sagliksistemi.com', 'Admin İsmi', 'doktor')
-- ON CONFLICT (id) DO NOTHING;
