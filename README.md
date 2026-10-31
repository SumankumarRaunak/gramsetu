# GramSetu

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
   `08_closure_verification.sql`, `10_backfill_submitter_snapshot.sql`,
   `11_authority_workflow.sql`, `12_admin_delete_complaint.sql`,
   `13_authority_handoff_and_storage.sql`, and `14_storage_api_delete.sql`) in
   the **Supabase Dashboard → SQL Editor**.
   If complaints already exist, also run `10_backfill_submitter_snapshot.sql`
   once to populate their citizen contact details.

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

## Complaint Workflow

After `11_authority_workflow.sql` is applied, a new complaint is assigned
directly to the active Gram Panchayat Sachiv matching its village, panchayat,
block, and district. The Sachiv can verify or reject it without developer/admin
approval. The initial SLA is 7 days; overdue files automatically move to
Mukhiya, then BDO, then DM. Each assignment and escalation is recorded in the
citizen timeline and creates a pending email notification.

Deploy `send-complaint-email` and configure its SMTP secrets plus
`APP_URL=https://complaint-management-drab.vercel.app`. Run the function every
few minutes using Supabase cron or an external scheduler to deliver pending
authority emails.

## Official Accounts

Run `npm run seed` once with `SUPABASE_SERVICE_ROLE_KEY` configured in `.env`.
It creates the central administrator and four official accounts: Gram Panchayat,
Mukhiya, BDO, and DM. The four authority accounts use the password
`Authority@1234` until changed in Supabase Authentication.

## Google Redirect Error

For `Error 400: redirect_uri_mismatch`, Google Cloud Console must contain this
exact Web OAuth redirect URI, including the `https://` scheme and no extra slash:

`https://hlwcbrvdlbnnxkbltyug.supabase.co/auth/v1/callback`

Add it under **Google Cloud Console → APIs & Services → Credentials → OAuth 2.0
Client IDs → Authorized redirect URIs**. Do not add the application homepage in
this field. Add the homepage separately under **Authorized JavaScript origins**
and in **Supabase → Authentication → URL Configuration**. Then paste the same
Google Client ID and Client Secret into **Supabase → Authentication → Providers
→ Google**.

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
