# TODO

- [x] Filter out the signed-in user from map markers using auth user id. _(tested: not run)_
- [x] Quote circle IDs in Supabase realtime location subscription to ensure events arrive. _(tested: not run)_
- [x] Update background permission state when Android background permission is granted. _(tested: not run)_

Note: Not tested yet; run a manual end-to-end check when ready.

## Step 5 - Background & Offline Sync
- [ ] Persist last-known location locally when offline (AsyncStorage) and push on reconnect/offline toggle. _(tested: not run)_
- [ ] Ensure background task writes a final `is_last_known=true` row before stopping tracking. _(tested: not run)_
- [ ] Add retry/backoff for failed Supabase inserts (foreground + background) to avoid lost points. _(tested: not run)_
- [ ] Surface offline state in UI and show last-known marker/badge distinctly. _(tested: not run)_
- [ ] Prune old local cached locations to avoid unbounded storage growth. _(tested: not run)_

## Auth Persistence
- [ ] Keep user signed in between app launches (reuse Supabase session; auto-restore on startup). _(tested: not run)_

## Step 6 - Testing & Docs
- [ ] Add basic E2E/manual test checklist covering auth, circles, realtime map, background/offline sync. _(tested: not run)_
- [ ] Write README setup/run steps (env vars, Expo commands, Supabase setup). _(tested: not run)_
- [ ] Document known limitations (web foreground-only tracking, Android battery impact, no iOS). _(tested: not run)_
- [ ] Add minimal unit/integration tests where feasible (e.g., circle flows, location reducer logic). _(tested: not run)_
