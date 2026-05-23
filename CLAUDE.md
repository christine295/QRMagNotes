# QRMagNotes

Household coordination hub built around persistent QR codes. A user creates a hub with a stable URL (`/h/[slug]`), prints the QR code, and places it somewhere physical. The content behind the QR can be updated anytime without reprinting.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Supabase** — auth (email + Google OAuth) + database
- **Tailwind CSS**
- **`qrcode` npm package** — QR PNG generation in browser

## Running locally

Node.js is installed at `C:\Program Files\nodejs\` but is NOT in the system PATH. Always prefix node/npm commands:

```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
npm run dev
```

App runs at http://localhost:3000

## Environment variables

Stored in `.env.local` (not committed). See `.env.local.example` for keys needed:
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Supabase project ref: `hiotzlktznkznjxjakup`

## Project structure

```
app/
  page.tsx                      — redirects to /dashboard or /login
  login/page.tsx                — email + Google auth
  signup/page.tsx               — email + Google auth
  auth/callback/route.ts        — OAuth callback handler
  dashboard/page.tsx            — hub list
  dashboard/hub/new/page.tsx    — create hub
  dashboard/hub/[id]/edit/page.tsx — edit hub
  h/[slug]/page.tsx             — public hub page (no auth required)

components/
  HubCard.tsx     — dashboard card with Edit/View/Copy/QR buttons
  HubForm.tsx     — create/edit form; includes template picker on create
  LinkEditor.tsx  — add/remove/reorder links with ▲▼ buttons
  QRButton.tsx    — downloads QR PNG via qrcode package

lib/
  types.ts              — Hub, HubLink, Profile types
  supabase/client.ts    — browser Supabase client
  supabase/server.ts    — server Supabase client

proxy.ts          — Next.js 16 proxy (replaces middleware.ts); protects /dashboard routes
supabase/schema.sql — full DB schema + RLS policies
```

## Database

Three tables — all with RLS enabled:
- **profiles** — auto-created via trigger on `auth.users` insert
- **hubs** — owned by user; publicly readable (for /h/[slug] page)
- **hub_links** — belongs to hub; publicly readable

## Core concepts

**Hub modes:**
- `landing` — shows a mobile page with title, description, optional image, and link buttons
- `redirect` — instantly redirects to a destination URL

The QR code always points to `/h/[slug]`. The slug is permanent — changing it breaks printed QR codes.

**Links:** URL is optional. A link without a URL renders as a non-clickable label with a themed border.

## Templates (on hub create)

Template picker appears before the form when creating a new hub. Defined in `TEMPLATES` array in `HubForm.tsx`. Currently:
- **Blank** — empty form
- **Artwork Memory Hub** — pre-fills title, violet theme, 8 links (Spotify Playlist, Artist Notes, Moon Phase, Inspiration, Color Palette, Process Photos, Materials Used, Private Notes)

To add more templates: add an entry to the `TEMPLATES` array in `components/HubForm.tsx`.

## Theme colors

8 preset swatches (no free color picker): Blue, Green, Amber, Rose, Violet, Teal, Orange, Slate. Defined in `THEME_COLORS` in `HubForm.tsx`.

## Known Next.js 16 notes

- `middleware.ts` is renamed to `proxy.ts` and exports `proxy()` not `middleware()`
- Route params are Promises: `const { id } = await params` in server components
- `cookies()` is async: `const cookieStore = await cookies()`

## What's NOT built (MVP scope)

No payments, teams, analytics, AI, notifications, messaging, drag-and-drop builder, file upload (images are URL only).
