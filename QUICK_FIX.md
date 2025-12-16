# Quick Fix: Circle Creation Error

## Problem
When trying to create a circle, you get an error. This is because the initial migration had incomplete Row Level Security (RLS) policies.

## Solution (Takes 1 minute)

### Step 1: Run the Fix
1. Open your Supabase Dashboard at https://supabase.com/dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/002_fix_rls_policies.sql`
4. Click **Run**

### Step 2: Test Auth is Working
**IMPORTANT:** Before testing the app, verify authentication is working in Supabase:

In SQL Editor, run:
```sql
SELECT auth.uid() as my_user_id;
```

**Expected:** Should return your user ID (a UUID like `175b3654-0ee0-4f85-b153-534f7af89228`)

**If it returns NULL:** You need to authenticate in the SQL Editor:
1. Look for a "Use Authenticated User" toggle or similar at the top of SQL Editor
2. Or copy your auth token from browser DevTools (Application → Local Storage → `sb-*-auth-token`)

### Step 3: Verify Policies
Run this query to check you have at least 11 policies:
```sql
SELECT COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('circles', 'circle_members', 'locations');
```

Should return: `policy_count: 11` or higher

### Step 4: Test Circle Creation
1. Refresh your app
2. Try creating a circle again
3. It should work now!

## What Was Wrong?

The initial migration was missing 3 critical policies:

1. **`circle_members_read_own`** - Without this, users couldn't read their own memberships, so the app couldn't display circles
2. **`circle_members_insert_self`** - The old policy only allowed `status='pending'`, but when you create a circle, you need `status='accepted'` as admin
3. **`circles_read_pending`** - Users couldn't see circles they requested to join

## Already Applied the Fix?

If you already ran `002_fix_rls_policies.sql`, your app should now work for:
- ✅ Creating circles (as admin with accepted status)
- ✅ Joining circles (as member with pending status)
- ✅ Viewing your circles list
- ✅ Admins accepting/rejecting members
- ✅ Multi-circle support

## Still Getting "violates row-level security policy" Error?

This means `auth.uid()` is returning NULL. Here's how to debug:

### Check 1: Verify You're Logged In
In your app's browser console:
```javascript
// Check if user is authenticated
const { data } = await supabase.auth.getUser();
console.log('Current user:', data.user);
```

Should show your user object. If NULL, you're not logged in - sign in first!

### Check 2: Verify Auth Token is Being Sent
In browser DevTools → Network tab:
1. Try creating a circle again
2. Look for the POST request to `/rest/v1/circles`
3. Check the **Request Headers**
4. Look for `Authorization: Bearer eyJ...`

If the Authorization header is missing or says "Bearer undefined", your session expired - sign out and sign in again.

### Check 3: Session Persistence
Try this:
1. Sign out completely
2. Close and reopen the browser tab
3. Sign in again
4. Try creating a circle

## Still Having Issues?

Check the **Troubleshooting** section in `CIRCLE_SETUP.md` for more detailed debugging steps.
