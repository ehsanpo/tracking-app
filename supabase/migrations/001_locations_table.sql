-- Create locations table for real-time location tracking
CREATE TABLE IF NOT EXISTS locations (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  circle_id uuid REFERENCES circles(id) ON DELETE CASCADE NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  accuracy double precision,
  is_last_known boolean DEFAULT false,
  recorded_at timestamptz DEFAULT now()
);

-- Index to find last-known location quickly
CREATE INDEX IF NOT EXISTS idx_locations_circle_user_time 
  ON locations (circle_id, user_id, recorded_at DESC);

-- Index for realtime queries
CREATE INDEX IF NOT EXISTS idx_locations_circle_time 
  ON locations (circle_id, recorded_at DESC);

-- Enable Row-Level Security
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read locations only if they are accepted members of the circle
CREATE POLICY "Users can view locations in their circles"
  ON locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM circle_members
      WHERE circle_members.circle_id = locations.circle_id
        AND circle_members.user_id = auth.uid()
        AND circle_members.status = 'accepted'
    )
  );

-- Policy: Users can insert their own location for circles they are accepted members of
CREATE POLICY "Users can insert their own location"
  ON locations
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM circle_members
      WHERE circle_members.circle_id = locations.circle_id
        AND circle_members.user_id = auth.uid()
        AND circle_members.status = 'accepted'
    )
  );

-- Policy: Users can update their own locations
CREATE POLICY "Users can update their own location"
  ON locations
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own locations
CREATE POLICY "Users can delete their own location"
  ON locations
  FOR DELETE
  USING (user_id = auth.uid());

-- Enable realtime for locations table
ALTER PUBLICATION supabase_realtime ADD TABLE locations;

-- Create function to clean up old locations (optional - for data retention)
CREATE OR REPLACE FUNCTION cleanup_old_locations()
RETURNS void AS $$
BEGIN
  -- Keep only the last 30 days of location history
  -- Keep is_last_known=true records indefinitely
  DELETE FROM locations
  WHERE recorded_at < NOW() - INTERVAL '30 days'
    AND is_last_known = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for documentation
COMMENT ON TABLE locations IS 'Stores real-time location updates for circle members';
COMMENT ON COLUMN locations.is_last_known IS 'Marks the last known location when user goes offline';
