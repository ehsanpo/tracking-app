# Family Tracking App - User Stories

Every story has acceptance criteria and a checkbox to track completion.

## Authentication
- [ ] As a user, I can sign up with email and password so I can have a secure account.
  - Acceptance: Sign-up creates a Supabase auth user and leads to onboarding.

- [ ] As a user, I can sign in and sign out.
  - Acceptance: Session persists across app restart.

## Circles and Membership
- [ ] As a user, I can create a Circle and receive a join code.
  - Acceptance: A `circle` row exists in DB and creator is `admin` in `circle_members` with `status='accepted'`.

- [ ] As a user, I can enter a join code to request to join a Circle.
  - Acceptance: `circle_members` row created with `status='pending'`.

- [ ] As an admin, I receive and can view pending membership requests.
  - Acceptance: Admin sees pending requests via query or realtime notification.

- [ ] As an admin, I can accept or reject a membership request.
  - Acceptance: Accepting sets `status='accepted'` and the user can view the circle map. Rejecting removes/sets `status='rejected'`.

- [ ] As a user, I can join multiple Circles and manage membership in each.
  - Acceptance: A user can have multiple `circle_members` rows with `status='accepted'` for different circles.

## Map and Location Sharing
- [ ] As a member, I can see all accepted circle members on a map in real-time.
  - Acceptance: After joining and being accepted, the app subscribes to `locations` and displays markers for each member.

- [ ] As a user, I can see members from all my joined Circles overlaid on the same map.
  - Acceptance: Map displays markers for members across all accepted circles; markers indicate circle affiliation (color or badge).

- [ ] As a user, I can toggle visibility of specific Circles on the map.
  - Acceptance: Toggling a Circle hides/shows its members on the shared map immediately.

- [ ] As a user, I can filter the map to a single Circle.
  - Acceptance: Selecting a single Circle filters the markers and the member list to that Circle only.

- [ ] As a member, my device publishes my current location while app is in foreground.
  - Acceptance: Location rows are written to `locations` and other members see updates in real-time.

- [ ] As a member, my last-known location is available to the circle if I'm offline.
  - Acceptance: When a user goes offline, their last-known location is stored and visible.

## Background & Offline
- [ ] As a user on Android, the app can publish location updates while backgrounded (optional toggle per user).
  - Acceptance: Background location task sends periodic updates that other members receive.

- [ ] As a user, the app saves location locally if there is no network and synchronizes when online.
  - Acceptance: Local last-known stored and pushed when connection resumes.

## UX & Admin Tools
- [ ] As a user, I can view a list of members with online/offline and last-seen times.
  - Acceptance: Member list shows status derived from the most recent `locations` timestamp.

- [ ] As an admin, I can remove members and regenerate a join code.
  - Acceptance: Removing deletes or marks `circle_member` status and regenerating updates `join_code`.

## Security & Privacy
- [ ] As a user, only accepted Circle members can see each other's locations.
  - Acceptance: RLS policies prevent non-members from reading `locations`.

- [ ] As a user, location sharing requires explicit permission prompt.
  - Acceptance: App requests platform location permission and explains purpose.

## Testing & Edge Cases
- [ ] System handles duplicate join codes robustly (unique constraint and regenerating code).
- [ ] System rate-limits location writes to avoid DB overload (client-side throttling).

---

Use this file to check progress; I can expand each story into smaller tasks if you want.
