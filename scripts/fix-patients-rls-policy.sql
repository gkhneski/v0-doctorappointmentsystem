-- Creating RLS policy to allow public patient registration
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "patients_insert_all" ON patients;

-- Create new policy that allows anyone to insert patients (for appointment booking)
CREATE POLICY "patients_insert_all" 
ON patients 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'patients';
