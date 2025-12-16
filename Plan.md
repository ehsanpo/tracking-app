# Family Tracking App - Plan

## Purpose
Build a simple, privacy-first family tracking app that lets family members create private "Circles" and share live locations with each other. Members join via a join-code and must be accepted by the circle admin. The app targets Android and Web using Expo/React Native, and Supabase for backend, DB, realtime, and auth.

## Goals (MVP)
- Real-time map showing all members of a Circle.
- Create Circle with a join code; admin accepts membership requests.
- Persist last-known location for offline users.
- Authentication (email/password initially).
- Works on Android and Web (Expo-managed).

## Non-goals (first iteration)
- iOS support (defer to next iteration).
- Advanced privacy controls (per-person visibility toggles) — keep simple for MVP.
- Location-history timelines (only last-known + live updates).

## Tech Stack
- Frontend: React Native + Expo (Android + Web)
- Map: `react-native-maps` (Android) and lightweight web map (Leaflet or Mapbox GL JS) for Web view component.
- Location: `expo-location`, `expo-task-manager` for background tasks on Android.
- Backend & Realtime: Supabase (Postgres, Realtime, Auth, Storage if needed)
- Client SDK: `@supabase/supabase-js` (v2 preferred)

## High-level Architecture
- Mobile/Web App (Expo) connects to Supabase using `@supabase/supabase-js`.
- Users authenticate with Supabase Auth.
- Circle objects and membership stored in Postgres tables; `locations` table stores live updates.
- App listens to `locations` changes for the user's Circles using Supabase Realtime (postgres_changes).
- On background/ offline, app writes last-known location to local storage; on reconnect it writes a final 'last-known' row to Supabase.

## Multiple Circles
- Users may join multiple Circles. The app will allow overlaying members from all joined Circles on a single map view.
- Subscriptions: the client subscribes to location updates for every circle the user has `status='accepted'` in (or to a single subscription filtered by multiple `circle_id`s).
- UI: provide per-circle color indicators and simple toggle/filter controls so users can show/hide specific Circles on the shared map.

## Database Schema (proposal)
-- Supabase uses Auth for users (no separate users table required, but you can have a `profiles` table)

-- profiles (optional)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- circles
CREATE TABLE circles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  join_code text NOT NULL UNIQUE,
  created_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now()
);

-- circle_members
CREATE TABLE circle_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid REFERENCES circles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  role text DEFAULT 'member', -- 'admin' or 'member'
  status text DEFAULT 'pending', -- 'pending' or 'accepted' or 'rejected'
  joined_at timestamptz
);

-- locations
CREATE TABLE locations (
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
CREATE INDEX ON locations (circle_id, user_id, recorded_at DESC);

Notes:
- We mark `is_last_known` true for the single row that represents an offline saved position (or simply insert a row and query latest).

## Row-Level Security & Policies (High Level)
- Enable RLS on critical tables (`circles`, `circle_members`, `locations`).
- Example policy: allow read `locations` only if requester is an accepted member of that `circle`.
- Admin-only operations (e.g., accepting members) require checking `role='admin'` in `circle_members`.

## Supabase Setup Steps (Concise)
1. Create a Supabase project at https://supabase.com and note the `URL`, `anon` key, and `service_role` key (secure `service_role`).
2. Create the tables above via SQL Editor (or run migration SQL).
3. Enable Realtime/Replication for the `locations` table.
4. Add RLS policies (see RLS notes) and test using Supabase Auth test users.
5. Create environment variables for the app: `SUPABASE_URL` and `SUPABASE_ANON_KEY` for client; keep `service_role` secret for server-only tasks.

## Realtime Strategy
- Use `supabase.channel(...)` or the v2 realtime API to subscribe to `locations` INSERT events for the set of `circle_id`s the user belongs to. Subscriptions can be created per-circle or as a single filtered subscription depending on API and performance needs.
- For performance, subscribe only to circles the current user is an accepted member of, and consider rate-limiting and client-side batching when many updates arrive.

## Client Implementation Notes
- Auth: Use Supabase Auth on app launch to check session and redirect to onboarding or main map view.
- Circle creation: create circle with a random 6-character join code, add creator to `circle_members` as `admin` with `status='accepted'`.
- Join flow: user enters join code -> app calls RPC or queries `circles` to find id -> insert into `circle_members` with `status='pending'` -> notify admin (via Realtime or notifications) -> admin accepts by updating `status='accepted'`.
- Location publishing: app periodically (configurable, e.g., every 10s while foreground, or background config) writes rows to `locations` with `is_last_known=false` and also update a small `last_known` record (optionally via `is_last_known` or a separate table) so apps can quickly load latest points.
- Offline handling: store last location to local storage (e.g., `AsyncStorage`) and when connection restored, push a final `is_last_known=true` location row.

### Multi-Circle Client Notes
- On login the client fetches the list of accepted circles for the user and opens realtime subscriptions for those circles.
- Incoming location events are merged into a single map data model keyed by `user_id` and annotated with one or more `circle_id`s; if one person appears in multiple circles, the UI should deduplicate and indicate multi-circle membership.
- Provide per-circle visibility toggles and per-circle colors so users can easily distinguish members from each Circle on the shared map.

## Map & UX
- Map center: show all accepted members' latest positions with avatars and names.
- Marker updates: smooth animate marker moves on new location messages.
- Member list: small panel listing online vs offline with last-seen timestamps.
- Admin UX: accept/reject membership requests, regenerate join code, remove members.

## Design & Design System
- **Design tokens:** centralize all colors, spacing, type sizes, radii, and elevation values as reusable variables (a single `design/tokens` file). Use variables so themes and branding can be changed easily.
  - **Colors:** expose primary, secondary, background, surface, text (primary/secondary), success, warning, danger, and per-circle accent colors as variables.
  - **Implementation:** for Web use CSS variables (`:root { --color-primary: #... }`), for React Native export the same tokens from a JS/TS `tokens.ts` file so both platforms share values.

- **8‑point grid:** use an 8px baseline for spacing, sizing and layout to ensure consistent rhythm. Example spacing scale: 4 (half-step), 8, 16, 24, 32, 40, 48, 64.
  - Use multiples of 8 for paddings, margins, and component heights. Allow a 4px half-step for tight UI elements.

- **Visual style:** modern, dark, slightly dimensional (not flat). Use subtle elevation/shadows, rounded corners, and soft gradients sparingly to add depth while keeping the UI clean.
  - Buttons: clear primary/secondary styles with subtle elevation and touch feedback.
  - Cards & panels: mild shadow/elevation with consistent corner radii from tokens.

- **Typography & scale:** choose a readable type scale with clear hierarchy (e.g., 14/16 body, 18/20 subhead, 24/28 headings). Keep line-height and font weights consistent in tokens.

- **Per-circle visual identity:** assign each Circle a distinct accent color token (generated when Circle is created) used for its markers, list badges, and subtle map overlays.

- **Accessibility:** ensure color contrast meets WCAG AA for body text; expose an option for larger text; ensure map markers and list items have accessible labels.

- **Theming & dark mode:** provide light and dark token sets and switch at runtime. Keep semantic tokens (background/surface/text) consistent across themes.

- **Prototyping & assets:** prepare a small component library (buttons, inputs, list items, map marker components) and a Sketch/Figma file or simple design spec describing spacing and token usage.


## Location Permissions & Tracking

### Android
**Permissions Required:**
- **Foreground Location** (`ACCESS_FINE_LOCATION`): Required for GPS-level accuracy when app is visible
  - Use `expo-location` with `requestForegroundPermissionsAsync()`
  
- **Background Location** (`ACCESS_BACKGROUND_LOCATION`): Required for location updates when app is not visible (Android 10+)
  - Use `expo-location` with `requestBackgroundPermissionsAsync()`
  - Requires separate permission prompt with clear user explanation
  - Must justify usage to Google Play Store
  
- **Activity Recognition** (`ACTIVITY_RECOGNITION`): Optional but recommended for battery optimization (Android 10+)
  - Detects user activity: walking, running, driving, stationary, cycling
  - Allows smart location polling (less frequent when stationary, more when moving)
  - Reduces battery drain significantly
  - **Library**: Use `react-native-activity-recognition` (preferred over `react-native-motion-activity-tracker`)
    - More actively maintained with better Android support
    - Install: `npx expo install react-native-activity-recognition`
    - Requires custom development build (`npx expo prebuild` + `npx expo run:android`)
    - API: Subscribe to activity updates with confidence levels (0-100)
  - Note: Not compatible with Expo Go; requires custom development client

**Implementation:**
- Use `expo-location` with `startLocationUpdatesAsync` and `expo-task-manager` to publish periodic location updates while app is backgrounded.
- Be mindful of battery and prompt users with clear consent messaging.
- Consider adding activity recognition in future iterations for better battery efficiency.

### Web
**Capabilities & Limitations:**
- Uses browser's Geolocation API (HTML5)
- Requires HTTPS in production (localhost works without HTTPS)
- Browser permission prompt required (similar to mobile)
- **Foreground only** - location updates stop when browser tab is inactive/backgrounded
- **Lower accuracy** - typically WiFi/IP-based positioning (~50-100m accuracy) vs GPS on mobile
- No background location tracking capability
- No activity recognition available
- `expo-location` works on web but with above limitations

**Best for:**
- Testing and development
- Admin/desktop monitoring use cases
- Viewing family members' locations (receive updates from mobile users)
- Less suitable for continuous location sharing from web browsers

## Data Retention & Privacy
- Keep minimal retention for `locations` (e.g., keep 30 days) or prune older rows.
- Only keep `last_known` indefinitely if required; document retention policy in app and settings.

## Developer Workflow & Environment
- Local: `expo start --web` for web; `expo run:android` or Expo dev client for Android testing.
- Add `.env` or other secure local env for `SUPABASE_URL` and `SUPABASE_ANON_KEY` (do not commit keys).

## Milestones (Short)
1. Planning & user stories (this doc + checklist)
2. Scaffold app + Supabase schema
3. Auth + onboarding + create/join circle
4. Live map + realtime location streaming
   - **Foreground Tracking**: Gives us users location whenever our app is visible on the screen. Easy to set up & use.
   - **Background Location Tracking**: Gives us the users location at all times, even if the app is not visible or device is locked. Uses considerably more battery power. Much more complicated to set up.
5. Background & offline sync
6. Testing and docs

## Risks & Open Decisions
- Map library parity across Web and Android: may need different components per platform.
- Realtime scale: many frequent location writes could increase DB load — consider rate limiting on client & server side.

---

Created: December 2025
