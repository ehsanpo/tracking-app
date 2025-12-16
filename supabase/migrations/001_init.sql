-- Supabase migration: initial schema for circles, members, locations
-- Paste into Supabase SQL editor or use migrations.

-- Enable uuid generation (pgcrypto) if not available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- Index to find last-known quickly
CREATE INDEX IF NOT EXISTS idx_locations_circle_user_time ON locations (circle_id, user_id, recorded_at DESC);

-- Row Level Security: enable RLS on tables that contain sensitive data
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;

-- Function to check if a requesting user (auth.uid()) is an accepted member of a circle
CREATE OR REPLACE FUNCTION is_accepted_circle_member(p_circle uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM circle_members cm
    WHERE cm.circle_id = p_circle
      AND cm.user_id = auth.uid()
      AND cm.status = 'accepted'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Policy: only accepted circle members can read locations for that circle
CREATE POLICY "locations_read_for_members" ON locations
  FOR SELECT
  USING (is_accepted_circle_member(circle_id));

-- Policy: members can insert their own locations (auth.uid() == user_id)
CREATE POLICY "locations_insert_own" ON locations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: circle admins can update/delete locations if necessary (optional)
CREATE POLICY "locations_mod_admins_update" ON locations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM circle_members cm
      WHERE cm.circle_id = locations.circle_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
        AND cm.status = 'accepted'
    )
  );

CREATE POLICY "locations_mod_admins_delete" ON locations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM circle_members cm
      WHERE cm.circle_id = locations.circle_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
        AND cm.status = 'accepted'
    )
  );

-- Policy: circles table read: allow only members to read circle info
CREATE POLICY "circles_read_for_members" ON circles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM circle_members cm
      WHERE cm.circle_id = circles.id
        AND cm.user_id = auth.uid()
        AND cm.status = 'accepted'
    )
  );

-- Policy: create circle (auth users)
CREATE POLICY "circles_insert_auth" ON circles
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: circle_members table: users can insert a pending membership for themselves
CREATE POLICY "circle_members_request_self" ON circle_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Admins can update membership records for their circle
CREATE POLICY "circle_members_admins_manage_update" ON circle_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM circle_members cm2
      WHERE cm2.circle_id = circle_members.circle_id
        AND cm2.user_id = auth.uid()
        AND cm2.role = 'admin'
        AND cm2.status = 'accepted'
    )
  );

CREATE POLICY "circle_members_admins_manage_delete" ON circle_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM circle_members cm2
      WHERE cm2.circle_id = circle_members.circle_id
        AND cm2.user_id = auth.uid()
        AND cm2.role = 'admin'
        AND cm2.status = 'accepted'
    )
  );

-- Note: you may prefer RPCs for accepting members so you can enforce notifications and extra logic.
