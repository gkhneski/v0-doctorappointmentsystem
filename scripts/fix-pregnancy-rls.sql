-- Fix pregnancy RLS policies - check admin_users table for role
-- This allows doktor, hemsire, and sekreter to create/update pregnancies

-- For pregnancy_episodes table
DROP POLICY IF EXISTS "Admin can insert pregnancy episodes" ON pregnancy_episodes;
DROP POLICY IF EXISTS "Admin can update pregnancy episodes" ON pregnancy_episodes;
DROP POLICY IF EXISTS "Admin can delete pregnancy episodes" ON pregnancy_episodes;
DROP POLICY IF EXISTS "Staff can insert pregnancy episodes" ON pregnancy_episodes;
DROP POLICY IF EXISTS "Staff can update pregnancy episodes" ON pregnancy_episodes;
DROP POLICY IF EXISTS "Staff can delete pregnancy episodes" ON pregnancy_episodes;

-- Update SELECT policy to check admin_users table
DROP POLICY IF EXISTS "Admin can view all pregnancy episodes" ON pregnancy_episodes;

CREATE POLICY "All can view pregnancy episodes" ON pregnancy_episodes
  FOR SELECT USING (true);

CREATE POLICY "Staff can insert pregnancy episodes" ON pregnancy_episodes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND role IN ('doktor', 'hemsire', 'sekreter', 'admin')
    )
  );

CREATE POLICY "Staff can update pregnancy episodes" ON pregnancy_episodes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND role IN ('doktor', 'hemsire', 'sekreter', 'admin')
    )
  );

CREATE POLICY "Staff can delete pregnancy episodes" ON pregnancy_episodes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND role IN ('doktor', 'hemsire', 'sekreter', 'admin')
    )
  );

-- For pregnancy_visits table
DROP POLICY IF EXISTS "Admin can view all pregnancy visits" ON pregnancy_visits;
DROP POLICY IF EXISTS "Admin can insert pregnancy visits" ON pregnancy_visits;
DROP POLICY IF EXISTS "Admin can update pregnancy visits" ON pregnancy_visits;
DROP POLICY IF EXISTS "Admin can delete pregnancy visits" ON pregnancy_visits;
DROP POLICY IF EXISTS "Staff can insert pregnancy visits" ON pregnancy_visits;
DROP POLICY IF EXISTS "Staff can update pregnancy visits" ON pregnancy_visits;
DROP POLICY IF EXISTS "Staff can delete pregnancy visits" ON pregnancy_visits;

CREATE POLICY "All can view pregnancy visits" ON pregnancy_visits
  FOR SELECT USING (true);

CREATE POLICY "Staff can insert pregnancy visits" ON pregnancy_visits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND role IN ('doktor', 'hemsire', 'sekreter', 'admin')
    )
  );

CREATE POLICY "Staff can update pregnancy visits" ON pregnancy_visits
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND role IN ('doktor', 'hemsire', 'sekreter', 'admin')
    )
  );

CREATE POLICY "Staff can delete pregnancy visits" ON pregnancy_visits
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND role IN ('doktor', 'hemsire', 'sekreter', 'admin')
    )
  );

-- For pregnancy_outcomes table
DROP POLICY IF EXISTS "Admin can view all pregnancy outcomes" ON pregnancy_outcomes;
DROP POLICY IF EXISTS "Admin can insert pregnancy outcomes" ON pregnancy_outcomes;
DROP POLICY IF EXISTS "Admin can update pregnancy outcomes" ON pregnancy_outcomes;
DROP POLICY IF EXISTS "Admin can delete pregnancy outcomes" ON pregnancy_outcomes;
DROP POLICY IF EXISTS "Staff can view pregnancy outcomes" ON pregnancy_outcomes;
DROP POLICY IF EXISTS "Staff can insert pregnancy outcomes" ON pregnancy_outcomes;
DROP POLICY IF EXISTS "Staff can update pregnancy outcomes" ON pregnancy_outcomes;
DROP POLICY IF EXISTS "Staff can delete pregnancy outcomes" ON pregnancy_outcomes;

CREATE POLICY "All can view pregnancy outcomes" ON pregnancy_outcomes
  FOR SELECT USING (true);

CREATE POLICY "Staff can insert pregnancy outcomes" ON pregnancy_outcomes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND role IN ('doktor', 'hemsire', 'sekreter', 'admin')
    )
  );

CREATE POLICY "Staff can update pregnancy outcomes" ON pregnancy_outcomes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND role IN ('doktor', 'hemsire', 'sekreter', 'admin')
    )
  );

CREATE POLICY "Staff can delete pregnancy outcomes" ON pregnancy_outcomes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND role IN ('doktor', 'hemsire', 'sekreter', 'admin')
    )
  );
