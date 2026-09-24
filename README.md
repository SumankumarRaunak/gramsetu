# Smart Village Complaint Management System (GramSwaraj)

Citizen-facing portal (Hindi/English) for reporting village problems, tracking
multi-tier resolution — Gram Panchayat Officer → Mukhiya → Block Officer → DM —
with a statutory **7-day SLA**, photo-proof mandate, real-time timelines, and
citizen feedback.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite 8, Tailwind CSS 4, lucide-react icons
- **Backend:** Supabase (PostgreSQL, Auth, Storage) + GoTrue
- **Scripts:** Node/tsx for seeding and E2E verification (`scripts/`, `database/`)

## Run Locally

**Prerequisites:** Node.js (18+)

1. Install dependencies:
   ```
   npm install
   ```

2. Configure Supabase — copy `.env.example` to `.env` and fill in the values:
   ```
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```

3. Set up the database by running the SQL files in `database/` (in order,
   `01_tables.sql` → `06_grants_seed.sql`, plus `07_denormalize.sql`,
   `08_closure_verification.sql`) in the **Supabase Dashboard → SQL Editor**.

4. Enable Google sign-in:
   - In **Google Cloud Console → APIs & Services → Credentials**, create an OAuth
     client ID for a Web application.
   - Add `https://hlwcbrvdlbnnxkbltyug.supabase.co/auth/v1/callback` as an
     authorized redirect URI in Google Cloud.
   - In **Supabase Dashboard → Authentication → Providers → Google**, enable the
     provider and enter the Google client ID and client secret. Leave **Skip nonce
     checks** disabled and **Allow users without an email** disabled.
   - In **Authentication → URL Configuration**, add the app origins that may start
     login, such as `http://localhost:3000` and the production site URL.
   - The login screen now includes **Continue with Google**. Set `VITE_SITE_URL`
     for a fixed deployed return URL; otherwise the current browser origin is used.

5. Start the dev server (served on port 3000):
   ```
   npm run dev
   ```

## Common Scripts

| Command             | Description                                         |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Start Vite dev server on port 3000                  |
| `npm run build`     | Production build (`dist/`)                          |
| `npm run preview`   | Preview the production build                        |
| `npm run lint`      | Type-check with `tsc --noEmit`                      |
| `npm run seed`      | Seed demo authorities/complaints (uses service role)|
| `npm run e2e`       | End-to-end verification script                      |

## Features

- **Citizen:** register/login, submit complaints with photo evidence, track
  status by complaint ID, my complaints archive + receipt slip, notifications,
  feedback, bilingual (EN/HI) UI.
- **Authority:** role-based dashboards (Block Officer, Mukhiya, DM, Admin),
  forward/escalate, verify with resolution proof, close disputes, 7-day SLA.
- **Escalation engine:** automatic tier escalation and notifications.

## Important: Known Auth Issue

If **signing up** returns `500 (Internal Server Error)` on
`/auth/v1/signup`, the deployed `handle_new_user` trigger is broken. Fix it by
running **`database/09_fix_auth_trigger.sql`** in the Supabase SQL Editor
(drops the broken trigger and recreates an exception-safe one).

> Note: Supabase free-tier rate limits can also produce `HTTP 429` on repeated
> signup/login attempts — wait ~1 hour before retrying.

## Project Structure

```
src/
  pages/            # Landing, Login, Register, Dashboard, Submit, Track, ...
  components/       # Header, Footer, StatusBadge, ReceiptModal, ...
  context/AppContext.tsx   # global state + auth + data actions
  lib/api.ts        # Supabase data access
  lib/supabaseClient.ts   # Supabase client bootstrap
  assets/images/    # logo.jpg, smart_village_hero.jpg, proof images
database/           # SQL migrations (run in numeric order in Supabase)
scripts/            # seed.mjs, e2e-verify.mjs
```
