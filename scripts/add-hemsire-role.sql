-- Add 'hemsire' to the admin_users role check constraint
-- First, drop the existing constraint
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;

-- Add the new constraint with all three roles
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check 
  CHECK (role IN ('doktor', 'sekreter', 'hemsire'));

-- Verify the change
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'admin_users'::regclass AND conname = 'admin_users_role_check';
