# Visitor Analytics — Setup

A privacy-conscious analytics system for the portfolio: it records page views,
time-on-page, approximate location (city/country), referrer source and device —
and shows it all in a password-protected dashboard at `/admin`.

**What it does NOT do:** no cookies, no exact GPS, no camera/photos, and the raw IP
address is never stored (only the coarse city/country derived at the edge).

---

## 1. Create the database (Supabase — free)

1. Go to <https://supabase.com>, create a project.
2. Open **SQL Editor** and run:

```sql
create table if not exists public.analytics_events (
  id          bigserial primary key,
  created_at  timestamptz not null default now(),
  kind        text not null,          -- 'view' | 'duration'
  visitor_id  text,
  session_id  text,
  page_id     text,
  path        text,
  referrer    text,
  country     text,
  region      text,
  city        text,
  device      text,
  browser     text,
  os          text,
  screen      text,
  duration_ms integer
);

create index if not exists analytics_events_created_idx
  on public.analytics_events (created_at desc);

-- Keep the table private. The serverless functions use the service-role key
-- (server-side only) and bypass RLS; no public access is granted.
alter table public.analytics_events enable row level security;
```

3. In **Project Settings → API**, copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key (the secret one) → `SUPABASE_SERVICE_KEY`

> The service-role key is powerful and must stay server-side. It is only used
> inside `api/track.js` and `api/admin.js`, never in browser code.

---

## 2. Add environment variables in Vercel

Project → **Settings → Environment Variables** (Production), add:

| Name | Value |
| --- | --- |
| `SUPABASE_URL` | your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | the service-role key |
| `ADMIN_PASSWORD` | any strong password you choose |

Then **redeploy**.

---

## 3. Use it

- The site tracks automatically once deployed. First-time visitors see a short
  privacy notice; **Decline** stops tracking for them, and the browser's
  *Do Not Track* setting is respected.
- Open the dashboard at **`https://<your-site>/admin`** and enter `ADMIN_PASSWORD`.

The dashboard shows: total page views, unique visitors, sessions, average time on
site, top pages (with average time), countries, cities, referrers, devices,
browsers, and a recent-visits table.

---

## Files added

| File | Purpose |
| --- | --- |
| `analytics.js` | Client tracker + privacy notice (loaded on every page) |
| `api/track.js` | Collects events, derives city/country, writes to Supabase |
| `api/admin.js` | Password-protected read API for the dashboard |
| `admin.html` / `admin.css` / `admin.js` | The dashboard at `/admin` |

## Notes

- Location is **city-level only**, from the edge network — no popup, no GPS.
- To switch to strict opt-in (track only after "Got it"), in `analytics.js` move the
  `start()` call so it runs on the "Got it" click instead of on load.
- Local `vercel dev` won't have edge geo headers, so country/city appear blank
  locally; they populate on the deployed site.
