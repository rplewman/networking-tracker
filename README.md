# Networking Tracker

A private contact tracker for the people you want to stay in touch with — built for a class assignment requiring Neon Postgres, Neon Managed Better Auth, the Neon Data API, Row-Level Security, a separated React frontend and Node backend, and a Vercel deployment. Each signed-in user sees only their own contacts: create, edit, delete, sort, and filter them, with ownership enforced at the database level (not just in application code).

## Live URL

**App:** https://frontend-sepia-ten-34.vercel.app
**Backend API:** https://backend-one-gules-64.vercel.app/api

## Screenshots / walkthrough (grading evidence)

Every screenshot below is from the live deployment, captured in one continuous session against a real (throwaway) demo account with a scripted browser — not mockups, not staged separately. They're in the exact order they happened.

**Sign in and sign out**

| Sign in | Signed in (note "Sign out" in the header) | Signed out again |
|---|---|---|
| ![Sign in screen](docs/screenshots/01-sign-in.png) | ![Signed in, empty state](docs/screenshots/02-empty-state.png) | ![Back at the sign-in screen after clicking Sign out](docs/screenshots/13-signed-out.png) |

**Create → view → edit → delete → refresh** (one continuous flow, same account)

1. **Empty state** on a fresh account — no contacts yet:

   ![Empty state](docs/screenshots/02-empty-state.png)

2. **Create**: the add-contact form filled out, then the resulting list right after saving:

   | Form filled out | Saved — "Contact added." |
   |---|---|
   | ![Add contact form filled](docs/screenshots/03-add-contact-form.png) | ![List shows the new contact](docs/screenshots/04-after-first-add.png) |

3. Two more contacts added, for a total of three (also demonstrates the priority filter narrowing them back down to one):

   | All three contacts | Priority filter = "High" |
   |---|---|
   | ![Three contacts in the list](docs/screenshots/05-three-contacts.png) | ![Filtered to the one high-priority contact](docs/screenshots/06-priority-filter-high.png) |

4. **Edit**: Alan Turing's Role changed from "Cryptanalyst" to "Codebreaker (promoted)":

   | Editing (form open) | Saved — "Contact updated." |
   |---|---|
   | ![Inline edit form with the new role typed in](docs/screenshots/07-edit-form-role-changed.png) | ![List shows the updated role](docs/screenshots/08-after-edit-saved.png) |

5. **Delete**: Grace Hopper's row removed (count drops from 3 to 2):

   | Before delete | After delete — "Contact deleted." |
   |---|---|
   | ![Three contacts, about to delete Grace Hopper](docs/screenshots/09-before-delete.png) | ![Two contacts remain](docs/screenshots/10-after-delete.png) |

6. **Refresh**: full page reload (not a client-side re-render) — the same two contacts are still there, because they're in Postgres, not local state:

   ![Same two contacts after a hard page reload](docs/screenshots/11-after-refresh.png)

**Invalid input failing safely**

Submitting the add-contact form with an empty Name shows a clear inline error and does not create a row (the same rule is re-checked server-side even if this client-side check is bypassed — see the curl evidence in [Security & RLS](#security--rls)):

![Validation error: Name is required](docs/screenshots/12-validation-error.png)

**Mobile layout**

Signed back in at a 390×844 mobile viewport — table becomes stacked cards, and the full list is visible without scrolling:

![Mobile card layout showing all contacts](docs/screenshots/14-mobile-layout.png)

## Features

- Sign up / sign in / sign out via Neon Managed Better Auth
- Create, view, edit, delete contacts (name, company, role, where you met, notes, priority)
- Sort by name, priority, company, or date added, ascending or descending
- Filter by priority and free-text search across name/company/where-met
- Server-enforced validation: name required, priority restricted to `low` / `medium` / `high`
- Loading, empty, error, and success states throughout
- Responsive layout: table on desktop/tablet, stacked cards on mobile
- Database-level privacy: Row-Level Security means one user's contacts are structurally invisible to another, even if the backend had a bug

## Technology stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 19 + Vite + TypeScript | Explicit requirement: a plain React frontend, kept separate from the backend (two deployable apps, not one framework doing both) |
| Styling | Tailwind CSS | A real design system (spacing/color/typography tokens) with minimal dependency weight and responsive utilities built in, rather than hand-rolled CSS |
| Backend | Node.js + Express + TypeScript | Explicit requirement: a separate Node backend, so field validation and JWT verification run in trusted server code, not just the browser |
| Database | Neon Postgres | Serverless Postgres with branching, required by the assignment |
| Auth | Neon Managed Better Auth | Hosted auth (email/password), issues short-lived JWTs Postgres can verify directly via `auth.user_id()` |
| Data access | Neon Data API + `@neondatabase/neon-js` | A PostgREST-compatible REST layer over Postgres that enforces Row-Level Security per request, using the SDK's two-URL (`auth` + `dataApi`) client form |
| Hosting | Vercel | Required by the assignment; frontend and backend deploy as two separate Vercel projects |
| Infra-as-code | `neon` CLI + `neon.ts` (`@neon/config`) | Declares "Auth: on, Data API: on" as code (`neon deploy`) instead of manual console clicking, so the project's Neon configuration is reviewable and reproducible |

## Architecture

```
                          ┌─────────────────────────┐
  Browser  ───(1) auth───▶│  Neon Managed Better Auth │
     │                    └─────────────────────────┘
     │  (2) Bearer JWT
     ▼
┌───────────────────┐   (3) verify JWT (JWKS)   ┌──────────────────────┐
│  React frontend    │──────────────────────────▶│   Node/Express        │
│  (Vite, Tailwind)   │   REST calls, JWT in       │   backend              │
│  no DB/auth secrets │   Authorization header     │  - JWT verification    │
└───────────────────┘◀─────────────────────────│  - field validation    │
                          JSON responses          │  - forwards JWT        │
                                                   └──────────┬───────────┘
                                                              │ (4) same JWT forwarded
                                                              ▼
                                                   ┌──────────────────────┐
                                                   │   Neon Data API       │
                                                   │  (PostgREST-style)    │
                                                   │  enforces RLS using   │
                                                   │  auth.user_id()       │
                                                   └──────────┬───────────┘
                                                              ▼
                                                   ┌──────────────────────┐
                                                   │  Neon Postgres         │
                                                   │  contacts table + RLS  │
                                                   └──────────────────────┘
```

**Frontend** (`frontend/`) only ever talks to two things: Managed Better Auth (sign up/in/out, session) directly, and this app's own backend for every contact read/write. It never holds `DATABASE_URL` and never queries the Data API directly — `@neondatabase/neon-js`'s `dataApi.url` is still configured on the client (the two-URL object form the assignment asks for), but the app deliberately routes contact reads/writes through the backend instead of calling `.from('contacts')` from the browser, so validation runs in trusted server code (see [Security](#security--rls)).

**Backend** (`backend/`) is the trusted boundary. `src/middleware/auth.ts` verifies the caller's JWT against Managed Better Auth's JWKS endpoint before anything else runs. `src/lib/validation.ts` enforces "name required" and "priority ∈ {low, medium, high}" — pure functions, unit tested. `src/lib/neonClient.ts` then makes the actual Data API call, using `@neondatabase/neon-js`'s external-token client form (`dataApi.getToken`) to forward the exact, already-verified caller JWT for that one request — see the comment in that file for why this backend doesn't use the two-URL form's built-in session management (it's designed for one persistent browser session, not a stateless server handling many different signed-in users concurrently).

**Database**: `contacts` table with Row-Level Security — see [Schema](#database-schema) and [Security](#security--rls).

## Local setup

Requires Node.js 20+.

```bash
git clone <this-repo-url>
cd networkingtracker
```

### 1. Neon project

You need a Neon project with **Managed Better Auth** and the **Data API** enabled. Either:

- **Console**: Neon Console → your project → Data API page → check "Use Managed Better Auth" → Enable Data API. Copy the Auth URL and Data API URL from the Data API and Auth pages.
- **CLI** (what this repo was actually built with — see `neon.ts` at the repo root):
  ```bash
  npm i -g neon@latest
  neon login
  neon link --project-id <your-project-id> --branch production
  neon deploy   # applies neon.ts: auth: true, dataApi: true
  ```
  `neon deploy` writes `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_JWKS_URL`, and `NEON_DATA_API_URL` into a root-level `.env.local` (gitignored) — copy the values you need into `backend/.env.local` and `frontend/.env.local` below.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env.local   # fill in DATABASE_URL, NEON_AUTH_BASE_URL, NEON_AUTH_JWKS_URL, NEON_DATA_API_URL
npm run migrate              # creates contacts table + RLS policies
npm run dev                  # http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # fill in VITE_NEON_AUTH_BASE_URL, VITE_NEON_DATA_API_URL, VITE_API_URL
npm run dev                  # http://localhost:5173
```

Open `http://localhost:5173`, sign up, and start adding contacts.

## Environment variables

Real values only ever live in `.env.local` files (gitignored, never committed). `.env.example` in each app documents the required **names** with placeholders.

**`backend/.env.example`**
| Variable | Secret? | Purpose |
|---|---|---|
| `DATABASE_URL` | **Yes — server-only** | Used only by `db/migrate.ts` to apply the schema. Never read by any API route, never sent to the browser. |
| `NEON_AUTH_BASE_URL` | No (public URL) | Managed Better Auth's base URL — used to build the JWKS URL fallback and to check the JWT `iss` claim. |
| `NEON_AUTH_JWKS_URL` | No (public URL) | Exact JWKS endpoint used to verify incoming JWTs. |
| `NEON_DATA_API_URL` | No (public URL) | The Neon Data API endpoint this backend forwards verified requests to. |
| `FRONTEND_URL` | No | Origin allowed through CORS. |
| `PORT` | No | Local dev port (defaults to 3001). |

**`frontend/.env.example`**
| Variable | Secret? | Purpose |
|---|---|---|
| `VITE_NEON_AUTH_BASE_URL` | No (public URL) | Passed to `@neondatabase/neon-js` for sign up/in/out and session. |
| `VITE_NEON_DATA_API_URL` | No (public URL) | Completes the SDK's two-URL client form (see [Architecture](#architecture) for why the frontend doesn't call it directly). |
| `VITE_API_URL` | No | This app's own backend URL. |

The assignment's reference names (`NEXT_PUBLIC_NEON_AUTH_URL`, `NEXT_PUBLIC_NEON_DATA_API_URL`) assume a Next.js frontend; this app uses Vite (per the "React frontend, Node backend" requirement), so public vars use Vite's required `VITE_` prefix and Neon's own canonical names (`NEON_AUTH_BASE_URL`, `NEON_DATA_API_URL`) instead — same values, different prefix convention. `DATABASE_URL` stays server-only exactly as required either way.

## Database schema

`backend/db/schema.sql` (idempotent — safe to re-run):

| Column | Type | Notes |
|---|---|---|
| `id` | `bigint` | Primary key, identity column |
| `user_id` | `text` | `not null default auth.user_id()` — owner of the row |
| `name` | `text` | `not null` |
| `company` | `text` | optional |
| `role` | `text` | optional |
| `where_met` | `text` | optional |
| `notes` | `text` | optional |
| `priority` | `text` | `not null check (priority in ('low','medium','high'))` |
| `created_at` | `timestamptz` | `not null default now()` |
| `updated_at` | `timestamptz` | `not null default now()` |

## Security & RLS

- **RLS is enabled** on `contacts`, with **four separate policies** (not one catch-all `FOR ALL`):
  - `contacts_select_own` — `FOR SELECT USING (auth.user_id() = user_id)`
  - `contacts_insert_own` — `FOR INSERT WITH CHECK (auth.user_id() = user_id)`
  - `contacts_update_own` — `FOR UPDATE USING (auth.user_id() = user_id) WITH CHECK (auth.user_id() = user_id)`
  - `contacts_delete_own` — `FOR DELETE USING (auth.user_id() = user_id)`
- The `UPDATE` policy's `WITH CHECK` is what stops a user from reassigning a row to someone else — even if they tried to set `user_id` to another account's id in a PATCH request, the check re-evaluates `auth.user_id() = user_id` against the *new* row and rejects it.
- `user_id` defaults to `auth.user_id()` and is `NOT NULL`; the backend never accepts `user_id` from the request body, so ownership is always assigned by the database from the caller's verified JWT, not by client-supplied data.
- **Validation is enforced server-side**, independent of the browser: `backend/src/lib/validation.ts` (required name, `priority` enum) runs before any database write, and the `priority` `CHECK` constraint enforces the same rule at the database layer as a second, independent guarantee.
- **Two-account isolation, evidence** — two real accounts (`user-a-demo@…`, `user-b-demo@…`) against the **live** Neon Data API. User A creates a contact; User B then tries to read, edit, and delete it by its exact `id`. Real output, captured directly from the deployed project (`$DATA_API` = the Data API URL, tokens fetched from `{NEON_AUTH_BASE_URL}/token` after signing in as each account):

  ```
  # 1. User A creates a contact
  $ curl -X POST $DATA_API/contacts -H "Authorization: Bearer <User A token>" \
      -d '{"name":"User A Private Contact","priority":"high"}'
  [{"id":15,"user_id":"2f2842cb-...","name":"User A Private Contact","priority":"high", ...}]

  # 2. User B lists their own contacts — cannot see User A's row at all
  $ curl $DATA_API/contacts -H "Authorization: Bearer <User B token>"
  []

  # 3. User B tries to change User A's contact by id — no rows match, nothing happens
  $ curl -X PATCH "$DATA_API/contacts?id=eq.15" -H "Authorization: Bearer <User B token>" \
      -d '{"name":"Hacked by B"}'
  []

  # 4. User B tries to delete User A's contact by id — same result
  $ curl -X DELETE "$DATA_API/contacts?id=eq.15" -H "Authorization: Bearer <User B token>"
  []

  # 5. User A confirms their contact is exactly as they left it
  $ curl $DATA_API/contacts -H "Authorization: Bearer <User A token>"
  [{"id":15,"user_id":"2f2842cb-...","name":"User A Private Contact","priority":"high", ...}]
  ```

  Every cross-account attempt returns `[]` — not an error, not a 403, just an empty result — because RLS makes the row not exist from User B's point of view. Nothing about it (not even that a row with that id belongs to someone) leaks to User B.

  To reproduce yourself through the UI instead: sign up as one account and add a contact, sign out, sign up as a second account, and confirm its contact list is empty.
- **Secrets**: `DATABASE_URL` is the only real secret in this project. It is read only by `backend/db/migrate.ts`, is listed only as a placeholder in `.env.example`, and is gitignored everywhere it appears (`.env.local` in the repo root, `backend/`, and `frontend/`). The Auth and Data API URLs are not secrets — they're meant to be public per Neon's own documentation, and the assignment's own env var list treats them as public variables.
- **No secret ever entered Git history, evidence**: the full commit history was checked for the real database password, any JWT, and any cookie secret — zero matches, anywhere, ever. Methodology (no real secret value is reproduced here, on purpose — a README is a public file, so evidence of a scan doesn't require pasting the thing being scanned for):
  ```
  $ git log -p --all | grep -c "<the actual DATABASE_URL password>"
  0
  $ git log -p --all | grep -c "eyJhbGci"          # any JWT ever committed
  0
  $ git log -p --all | grep -ic "cookie_secret"
  0
  $ git log -p --all -- '*.env*' | grep "DATABASE_URL="
  +DATABASE_URL=postgresql://user:password@YOUR-PROJECT-pooler.region.aws.neon.tech/neondb?sslmode=require
  ```
  The only `DATABASE_URL=` line that has ever been committed, in any commit, is that placeholder in `.env.example`. (An earlier draft of this README briefly and mistakenly pasted the real password inline as "example output" for the first command above — caught during review, the password was rotated immediately via the Neon API the moment it was noticed, and the commit containing it was removed from this repo's history rather than left in place. That's also why this section now deliberately never echoes the actual value it searches for.)

## Testing

```bash
cd backend
npm test
```

Runs `backend/test/validation.test.ts` (Node's built-in test runner) against `backend/src/lib/validation.ts` — the same pure functions the API routes call before touching the database. Real output from the command above:

```
> networking-tracker-backend@1.0.0 test
> node --import tsx --test test/**/*.test.ts

✔ rejects a missing name on create (1.9ms)
✔ rejects a whitespace-only name on create (0.3ms)
✔ rejects an invalid priority value (0.3ms)
✔ rejects a missing priority on create (0.3ms)
✔ accepts a valid full payload and trims/normalizes optional fields (2.8ms)
✔ partial mode allows omitted fields but still rejects a present-but-bad priority (0.4ms)
✔ partial mode still rejects an explicit empty name (0.2ms)
ℹ tests 7
ℹ pass 7
ℹ fail 0
```

What it checks: a missing or whitespace-only name is rejected; an invalid priority value is rejected; a missing priority is rejected on create; a full valid payload is accepted and optional fields are trimmed/normalized; partial-update mode allows omitted fields but still rejects a present-but-invalid priority or an explicit empty name.

This test suite deliberately does not hit a live database — RLS/two-account behavior is verified against real infrastructure as described above (see [Security & RLS](#security--rls)), not mocked, since RLS policies are meaningless to test against a mock.

## Deployment

Two separate Vercel projects — this is what "frontend and backend separated" means at deploy time, not just in the repo layout.

**Backend** (`backend/`):
```bash
cd backend
vercel
```
Set `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_JWKS_URL`, `NEON_DATA_API_URL`, and `FRONTEND_URL` (the frontend's eventual Vercel URL) as environment variables in the Vercel project dashboard. `backend/vercel.json` routes all requests to `api/index.ts`, a thin wrapper around the same Express `app` used locally.

**Frontend** (`frontend/`):
```bash
cd frontend
vercel
```
Set `VITE_NEON_AUTH_BASE_URL`, `VITE_NEON_DATA_API_URL`, and `VITE_API_URL` (the backend's deployed URL, e.g. `https://your-backend.vercel.app/api`) as environment variables in the Vercel project dashboard, then redeploy so the build picks them up.

Once both are live, update `FRONTEND_URL` on the backend project (and redeploy it) to the frontend's real URL so CORS allows it.

**Trusted domain (easy to miss):** Managed Better Auth rejects sign-in/sign-up requests from an origin it doesn't recognize (`{"code":"INVALID_ORIGIN"}`, HTTP 403) — `localhost` works out of the box, but a deployed URL doesn't until you add it:
```bash
neon neon-auth domain add https://your-frontend.vercel.app
```
(or via the Neon Console's Auth → Configuration → Trusted Domains page). Do this once per deployed frontend URL.

## Known limitations / what's next

- No password reset / email verification flow — Managed Better Auth supports both, just not wired into this UI yet.
- No pagination — `GET /api/contacts` returns the full list; fine for a personal contact tracker, not for thousands of rows.
- No optimistic UI updates — every action refetches the list rather than patching local state (except delete, which does update locally).
- The frontend production bundle isn't code-split (single ~560KB JS chunk); fine at this scale, would split by route if the app grew.
- No CI — tests run manually; a GitHub Actions workflow running `npm test` on push would be the next addition.
