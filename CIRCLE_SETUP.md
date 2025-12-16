# Setup Instructions for Circle & Onboarding Features

## 1. Database Migration

You need to run the migration SQL in your Supabase project:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run **BOTH** migration files in order:
   - First: `supabase/migrations/001_init.sql` (creates tables and basic policies)
   - Second: `supabase/migrations/002_fix_rls_policies.sql` (fixes missing policies for circle creation)
4. Verify that the following tables were created:
   - `profiles`
   - `circles`
   - `circle_members`
   - `locations`

**Important:** If you already ran `001_init.sql` and are having issues creating circles, you MUST run `002_fix_rls_policies.sql` to fix the Row Level Security policies.

## 2. Enable Realtime (Optional for now, required for milestone 4)

**Note:** You can skip this step for now since we're only at milestone 3 (circles/onboarding). This will be needed when we implement live location tracking in milestone 4.

### What is Realtime Replication?
Supabase Realtime allows your app to listen to database changes in real-time. When someone updates their location, all other members will instantly see the update on the map.

### How to Enable Realtime:

1. **Open your Supabase project** at https://supabase.com/dashboard
2. Click on your project to open it
3. In the left sidebar, click on **"Database"**
4. Look for the **"Replication"** tab (it should be next to "Tables", "Triggers", etc.)
5. You'll see a list of all your tables with toggle switches
6. Find the `locations` table in the list
7. Click the toggle switch next to `locations` to enable replication (it should turn green/blue)
8. Optionally, also enable replication for `circle_members` if you want real-time updates when new members join

### Alternative Method (if you can't find Replication tab):

Some Supabase versions have moved this setting:

1. Go to **Database** → **Publications** (instead of Replication)
2. Look for the publication named `supabase_realtime`
3. Click on it
4. You should see a list of tables
5. Check the box next to `locations` to add it to the publication
6. Save changes

### Verify It's Working:

After enabling, you can test if Realtime is working:
- Go to **Database** → **Tables** → **locations**
- Open the Supabase JavaScript console or your app
- Any INSERT/UPDATE/DELETE on the `locations` table should now trigger realtime events

### What happens if you skip this?

- The app will still work for creating and joining circles
- Location updates won't be real-time (you'd need to refresh manually)
- The map won't show live updates when members move
- You can enable this later when we implement milestone 4

## 3. Verify Your Database Setup (Optional)

You can run these SQL queries in Supabase SQL Editor to verify everything is set up correctly:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'circles', 'circle_members', 'locations');

-- Check Row Level Security is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('circles', 'circle_members', 'locations');

-- Check if there are any circles (should be empty initially)
SELECT * FROM circles;

-- Check RLS policies exist (should have at least 11 policies total)
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('circles', 'circle_members', 'locations')
ORDER BY tablename, policyname;
```

Expected results:
- 4 tables should exist
- `rowsecurity` should be `true` for circles, circle_members, and locations
- At least **11 RLS policies** should be listed:
  - **circles**: 3 policies (circles_insert_auth, circles_read_for_members, circles_read_pending)
  - **circle_members**: 5 policies (circle_members_admins_manage_delete, circle_members_admins_manage_update, circle_members_insert_self, circle_members_read_own, and possibly circle_members_request_self if not replaced)
  - **locations**: 4 policies (locations_insert_own, locations_mod_admins_delete, locations_mod_admins_update, locations_read_for_members)

## 4. Test the Flow

### Create a Circle Flow:
1. Sign up or sign in to the app
2. Since you have no circles, you'll see the Onboarding screen
3. Click "Create a Circle"
4. Enter a circle name (e.g., "Smith Family")
5. Click "Create Circle"
6. You'll see a join code (e.g., "ABC123") - copy this
7. You'll be taken to the circles list

### Join a Circle Flow (test with a second account):
1. Sign up with a different email or use incognito/another browser
2. On the Onboarding screen, click "Join a Circle"
3. Enter the join code from step 6 above
4. Click "Join Circle"
5. You'll see a message that your request is pending

### Accept Member Flow (as admin):
1. Back in the first account (the one that created the circle)
2. You should see your circle in the list
3. Click on the circle to open Circle Management
4. You'll see pending requests with the second user's ID
5. Click "Accept" to approve the member
6. Now both users are members of the circle

## 5. What's Implemented

✅ **User Stories Completed:**
- Create a Circle and receive a join code ✓
- Enter a join code to request to join a Circle ✓
- Admin can view pending membership requests ✓
- Admin can accept or reject membership requests ✓
- User can join multiple Circles ✓
- Circle creator is automatically admin with accepted status ✓

✅ **Features:**
- CircleContext for state management
- OnboardingScreen for first-time setup
- CircleManagementScreen for admins
- HomeScreen showing circles list
- Join code generation (6-character alphanumeric)
- Multi-circle support
- Role-based access (admin/member)
- Status tracking (pending/accepted/rejected)

## 6. Next Steps (Milestone 4)

- Implement real-time location tracking
- Add map with member markers
- Set up Realtime subscriptions for location updates
- Implement background location updates (Android)
- Add offline location storage and sync

## 7. Troubleshooting Common Issues

### "Failed to create circle" or RLS policy error when creating
**This is the most common issue!**

**Problem:** The initial migration (`001_init.sql`) had incomplete RLS policies.

**Solution:**
1. Go to Supabase SQL Editor
2. Run the file: `supabase/migrations/002_fix_rls_policies.sql`
3. This adds the missing policies:
   - `circle_members_read_own` - lets you read your own memberships
   - `circle_members_insert_self` - lets you insert yourself as admin when creating a circle
   - `circles_read_pending` - lets you see circles you're waiting to join

**Verify the fix:**
```sql
-- Should return at least 11 policies
SELECT COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('circles', 'circle_members', 'locations');
```

### "Invalid join code" error when joining
- Make sure the join code is exactly 6 characters
- Join codes are case-insensitive but should be uppercase
- Check that the circle exists in Supabase: `SELECT * FROM circles WHERE join_code = 'YOUR_CODE';`

### Can't see pending requests as admin
- Make sure you're logged in as the user who created the circle
- Pull down to refresh the list in Circle Management screen
- Verify in Supabase: `SELECT * FROM circle_members WHERE circle_id = 'YOUR_CIRCLE_ID' AND status = 'pending';`

### "Failed to create circle" error
- Check that the migration SQL has been run completely
- Verify RLS policies are in place
- Check browser console for detailed error messages
- Make sure you're authenticated (not logged out)

### User already a member error
- Each user can only have one membership per circle
- If you need to rejoin, an admin must remove you first
- Check status: `SELECT * FROM circle_members WHERE user_id = auth.uid();`

### Can't see circles after creating/joining
- The app automatically refreshes the circles list
- Make sure the membership status is 'accepted'
- Check: `SELECT * FROM circle_members WHERE user_id = auth.uid() AND status = 'accepted';`

### RLS Policy errors in console
- Make sure ALL tables have RLS enabled
- Verify all policies from the migration were created
- Try re-running the migration SQL
- Check Supabase logs in Dashboard → Logs

## 8. Known Limitations

- No profiles table integration yet (using user IDs in the UI)
- Map is a placeholder (will be implemented in milestone 4)
- No push notifications for membership requests (manual refresh needed)
- Copy join code only shows in alert (no clipboard integration yet)
- Remove member functionality not exposed in UI yet (API exists)
- No member profile pictures or display names yet
