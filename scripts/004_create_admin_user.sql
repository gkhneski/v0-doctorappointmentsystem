-- This script creates an admin user
-- IMPORTANT: You need to first create a user account via Supabase Auth
-- Then use that user's ID in this script

-- Example: After signing up an admin user, get their ID and insert into admin_users
-- You can do this by signing up normally, then running this with their actual user ID

-- For demo purposes, we'll create a trigger that makes the first user an admin
-- In production, you should manually add admin users

CREATE OR REPLACE FUNCTION public.make_first_user_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if this is the first user
  IF NOT EXISTS (SELECT 1 FROM public.admin_users LIMIT 1) THEN
    -- Make them an admin
    INSERT INTO public.admin_users (id, email, full_name, is_super_admin)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created_make_admin ON auth.users;

CREATE TRIGGER on_auth_user_created_make_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.make_first_user_admin();

-- To manually add an admin user (replace with actual user ID):
-- INSERT INTO public.admin_users (id, email, full_name, is_super_admin)
-- VALUES ('user-uuid-here', 'admin@healthcare.com', 'Admin Name', true)
-- ON CONFLICT (id) DO NOTHING;
