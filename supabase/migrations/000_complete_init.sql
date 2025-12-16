-- ====================
-- COMPLETE DATABASE SETUP
-- ====================
-- Run this once to set up everything for the tracking app
-- Combines all migrations into a single init script

-- Enable uuid generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================
-- TABLES
-- ====================

-- profiles (optional)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- circles
CREATE TABLE IF NOT EXISTS circles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  join_code text NOT NULL UNIQUE,
  created_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now()
);

-- circle_members
CREATE TABLE IF NOT EXISTS circle_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid REFERENCES circles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  role text DEFAULT 'member', -- 'admin' or 'member'
  status text DEFAULT 'pending', -- 'pending' or 'accepted' or 'rejected'
  joined_at timestamptz
);

-- locations
CREATE TABLE IF NOT EXISTS locations (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  circle_id uuid REFERENCES circles(id) NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  accuracy double precision,
  is_last_known boolean DEFAULT false,
  recorded_at timestamptz DEFAULT now()
);

-- ====================
-- INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS idx_locations_circle_user_time ON locations (circle_id, user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_circles_join_code ON circles(join_code);

-- ====================
-- FUNCTIONS
-- ====================

-- Function to generate unique join codes
CREATE OR REPLACE FUNCTION generate_unique_join_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_code text;
  code_exists boolean;
  attempts integer := 0;
  max_attempts integer := 10;
BEGIN
  LOOP
    -- Generate random 6-character code (avoiding confusing characters)
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    
    -- Replace confusing characters: 0->2, 1->3, O->P, I->J
    new_code := translate(new_code, '01OI', '23PJ');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM circles WHERE join_code = new_code) INTO code_exists;
    
    -- If unique, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
    
    -- Prevent infinite loop
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique join code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$;

-- Set default value for join_code to auto-generate
ALTER TABLE circles 
  ALTER COLUMN join_code SET DEFAULT generate_unique_join_code();

-- Helper function to check admin status (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION is_circle_admin(p_circle_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_id = p_circle_id
      AND user_id = p_user_id
      AND role = 'admin'
      AND status = 'accepted'
  );
$$;

-- Helper function to check if user is an accepted member of a circle
CREATE OR REPLACE FUNCTION is_accepted_circle_member(p_circle uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM circle_members cm
    WHERE cm.circle_id = p_circle
      AND cm.user_id = auth.uid()
      AND cm.status = 'accepted'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ====================
-- ROW LEVEL SECURITY
-- ====================

ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- CIRCLES POLICIES
-- Allow any authenticated user to read circles (needed for join code lookup)
CREATE POLICY "circles_read_own" ON circles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow any authenticated user to create circles
CREATE POLICY "circles_insert_auth" ON circles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- CIRCLE_MEMBERS POLICIES
-- READ: Own memberships OR all members if admin
CREATE POLICY "circle_members_read" ON circle_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_circle_admin(circle_id, auth.uid())
  );

-- INSERT: Only for your own user_id
-- Regular joins MUST be pending, only circle creators can be accepted admins
CREATE POLICY "circle_members_insert" ON circle_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      -- Regular join: MUST be pending member
      (status = 'pending' AND role = 'member')
      OR 
      -- Circle creator: can be accepted admin ONLY if they own the circle
      (status = 'accepted' AND role = 'admin' AND EXISTS (
        SELECT 1 FROM circles c 
        WHERE c.id = circle_id AND c.created_by = auth.uid()
      ))
    )
  );

-- UPDATE: Only admins can update memberships
CREATE POLICY "circle_members_update" ON circle_members
  FOR UPDATE
  TO authenticated
  USING (is_circle_admin(circle_id, auth.uid()));

-- DELETE: Only admins can delete memberships
CREATE POLICY "circle_members_delete" ON circle_members
  FOR DELETE
  TO authenticated
  USING (is_circle_admin(circle_id, auth.uid()));

-- LOCATIONS POLICIES
-- READ: Only accepted circle members can read locations for that circle
CREATE POLICY "locations_read_for_members" ON locations
  FOR SELECT
  USING (is_accepted_circle_member(circle_id));

-- INSERT: Members can insert their own locations
CREATE POLICY "locations_insert_own" ON locations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Circle admins can update locations if necessary
CREATE POLICY "locations_mod_admins_update" ON locations
  FOR UPDATE
  USING (is_circle_admin(circle_id, auth.uid()));

-- DELETE: Circle admins can delete locations if necessary
CREATE POLICY "locations_mod_admins_delete" ON locations
  FOR DELETE
  USING (is_circle_admin(circle_id, auth.uid()));

-- ====================
-- DONE!
-- ====================
-- All tables, functions, and policies are now set up.
-- Next steps:
-- 1. Enable Realtime replication for the locations table (when ready for Milestone 4)
-- 2. Test circle creation, joining, and admin approval flows
