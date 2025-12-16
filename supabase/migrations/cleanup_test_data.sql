-- CLEANUP SCRIPT: Remove all test data to start fresh
-- WARNING: This will delete ALL circles and memberships!
-- Only run this in development/testing

-- Delete all circle members
DELETE FROM circle_members;

-- Delete all circles  
DELETE FROM circles;

-- Verify everything is clean
SELECT 'circle_members' as table_name, COUNT(*) as count FROM circle_members
UNION ALL
SELECT 'circles', COUNT(*) FROM circles;

-- Should show 0 for both tables
