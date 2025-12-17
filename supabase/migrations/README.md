# Database Migrations

This directory contains SQL migrations for the Supabase database.

## How to Run Migrations

### Option 1: Supabase Dashboard (Recommended for Development)

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of the migration file
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl+Enter`

### Option 2: Supabase CLI (For Production)

If you have the Supabase CLI installed:

```bash
# Link your project
supabase link --project-ref your-project-ref

# Run pending migrations
supabase db push
```

## Migration Files

- `000_complete_init.sql` - Initial schema (circles, circle_members, profiles, RLS policies)
- `001_locations_table.sql` - Locations table with realtime support and RLS policies
- `cleanup_test_data.sql` - Utility script to clean up test data

## Running the Locations Migration

The `001_locations_table.sql` migration adds:
- `locations` table for real-time location tracking
- Indexes for performance
- Row-Level Security policies
- Realtime replication
- Data retention cleanup function

**Important**: After running the migration, verify that:
1. The `locations` table appears in your Tables list
2. Realtime is enabled for the `locations` table (check Publications)
3. RLS policies are active (check Policies tab)

## Verifying Realtime Setup

After running the migration, test realtime in the SQL Editor:

```sql
-- Check if realtime is enabled
SELECT * FROM pg_publication_tables WHERE tablename = 'locations';

-- Should return a row with pubname = 'supabase_realtime'
```

## Testing Location Inserts

Once the migration is run, you can test inserting a location:

```sql
-- Insert a test location (replace user_id and circle_id with actual values)
INSERT INTO locations (user_id, circle_id, latitude, longitude, accuracy)
VALUES (
  'your-user-id',
  'your-circle-id',
  37.7749,
  -122.4194,
  10.0
);
```
