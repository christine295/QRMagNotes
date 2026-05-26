# QRMagNotes

A QR-code hub platform for attaching evolving digital content to physical objects, spaces, and experiences. A user creates a hub with a stable URL (`/h/[slug]`), prints the QR code, and places it on something physical. The content behind the QR can be updated at any time without reprinting.

Targeting household, creative, ritual, and eventually business use cases (property records, customer hubs, product pages). Help content must stay template-agnostic — generic across all use cases, not ritual-specific.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Supabase** — auth (email + Google OAuth) + database + Storage (images, audio)
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
  page.tsx                           — redirects to /dashboard or /login
  login/page.tsx                     — email + Google auth
  signup/page.tsx                    — email + Google auth
  auth/callback/route.ts             — OAuth callback handler
  help/page.tsx                      — in-app help & reference page (no auth required)
  dashboard/collections/page.tsx     — main dashboard (hub list, collections)
  dashboard/hub/new/page.tsx         — create hub (template picker → form → ContentBlocksEditor)
  dashboard/hub/[id]/edit/page.tsx   — edit hub (Content tab + Settings tab)
  dashboard/hub/[id]/print/page.tsx  — print QR card
  h/[slug]/page.tsx                  — public hub page (server component, passes to HubView)

components/
  HubCard.tsx              — dashboard card with Edit/View/Copy/QR buttons
  HubForm.tsx              — create/edit form; TEMPLATES array; RITUAL_BLOCKS; tabs on edit
  HubView.tsx              — PUBLIC hub renderer (client component); all interactive logic
  ContentBlocksEditor.tsx  — block editor used in HubForm (add/edit/delete/reorder blocks)
  ChecklistBlock.tsx       — standalone checklist component (used only in edit preview)
  DeleteHubForm.tsx        — delete confirmation
  QRButton.tsx             — downloads QR PNG via qrcode package

app/api/hub/[hubId]/
  content_blocks/route.ts      — GET (list), POST (create) content blocks
  content_blocks/[id]/route.ts — PATCH (update data or sort_order), DELETE

lib/
  types.ts                    — Hub, ContentBlock, Profile types
  supabase/client.ts          — browser Supabase client
  supabase/server.ts          — server Supabase client
  supabase/uploadPhoto.ts     — upload image to hub-photos Storage bucket
  supabase/uploadAudio.ts     — upload audio to hub-audio Storage bucket

proxy.ts            — Next.js 16 proxy (replaces middleware.ts); protects /dashboard routes
supabase/schema.sql — full DB schema + RLS policies
HELP.md             — developer reference: block shapes, design notes, template authoring guide
```

## Database

Tables — all with RLS enabled:
- **profiles** — auto-created via trigger on `auth.users` insert
- **hubs** — owned by user; publicly readable for `/h/[slug]`
- **content_blocks** — belongs to hub; type + data (JSONB) + sort_order

`hub_links` table has been fully removed. All content is now in `content_blocks`.

### content_blocks type constraint

```sql
type text not null check (type in ('text', 'image', 'audio', 'file', 'link', 'phone', 'checklist', 'timeline', 'note'))
```

If this constraint is wrong in your Supabase instance, fix it:
```sql
ALTER TABLE public.content_blocks DROP CONSTRAINT content_blocks_type_check;
ALTER TABLE public.content_blocks ADD CONSTRAINT content_blocks_type_check
  CHECK (type IN ('text', 'image', 'audio', 'file', 'link', 'phone', 'checklist', 'timeline', 'note'));
```

### RLS for content_blocks

Block inserts/updates **must go through the API routes** (`/api/hub/[hubId]/content_blocks`), not direct Supabase client calls. RLS requires server-side auth context; direct client inserts fail silently.

## Core concepts

**Hub modes:**
- `landing` — shows the public content page (HubView)
- `redirect` — instantly redirects to `redirect_url`

**Privacy:**
- `public` — anyone can find and view
- `unlisted` — only people with the link can view
- `private` — only the owner when signed in (others see a lock screen)

The QR code always points to `/h/[slug]`. The slug is permanent — changing it breaks printed QR codes.

## Content blocks

Each block has `type`, `data` (JSONB), and `sort_order`. Supported types:

| Type | Data shape |
|------|-----------|
| `text` | `{ label, text, date? }` |
| `checklist` | `{ label, items: [{ id, text }] }` |
| `audio` | `{ label, url, date? }` |
| `link` | `{ label, url }` |
| `phone` | `{ label, url }` |
| `file` | `{ label, url }` |
| `image` | `{ url, caption }` |
| `timeline` | `{ label, events: [{ id, date, text }] }` |

## Public view (HubView.tsx)

`app/h/[slug]/page.tsx` is a server component that fetches data and passes props to `HubView`. All interactive rendering is in `components/HubView.tsx` (client component).

**Design system:**
- Background: `#FAF9F7` (warm cream) via `bg-[#FAF9F7]`
- Stone color palette throughout (`stone-*`)
- Blocks render as `divide-y divide-stone-100` hairline-separated rows — no stacked cards
- Collapsed sections: `py-3 text-sm font-medium text-stone-500`
- Expanded sections: `font-semibold text-stone-800`, content indented `pl-6`
- Checklist: 8px circle bullets (no checkbox box); `begin again` resets
- Link/phone/file: quiet text rows with small accent-opacity icon + arrow
- Image: edge-to-edge `rounded-xl`, no card wrapper
- Timeline: thin accent-color left border, tiny dot with `box-shadow: 0 0 0 2px #FAF9F7` ring

**Ceremonial/styled text (`isCeremonial()`):**
Any `text` block whose label contains `invocation`, `words to speak`, `quote`, `passage`, `poem`, `prayer`, or `sacred` renders in italic with a thin accent-color left border.

**Default collapse state (`defaultOpen()`):**
- Open: label contains `overview`, `step`, `note`, `invocation`, `words`
- Closed: label contains `setup`, `correspond`, `photo`, `memor`, `follow`, `playlist`, `voice`
- All others: open by default

## Templates

Defined in `TEMPLATES` array in `components/HubForm.tsx`. Template picker shown before create form.

### Blank
Empty hub, blue theme. No pre-built blocks.

### Artwork Archive
Pre-fills title "Untitled Artwork" + violet theme. Creates **8 content blocks**: Main Photo (image), Description (text), Details (text — Date Created / Medium / Dimensions / Status), Color Palette (text), Inspiration / Meaning (text), Additional Photos (image), Music / Playlist (link), Notes (text).

### Ritual Template
Violet theme. Creates **14 content blocks** via `Promise.all` API calls on hub creation:

| # | Label | Type |
|---|-------|------|
| 1 | Ritual Overview | text |
| 2 | Ritual Setup | checklist (8 items) |
| 3 | Correspondences | text |
| 4 | Ritual Steps | checklist (11 items) |
| 5 | Invocation / Words to Speak | text (ceremonial styling) |
| 6 | Quote / Passage | text (ceremonial styling) |
| 7 | Reference: Moon & Seasons | link |
| 8 | Reference: Herb & Correspondences | link |
| 9 | Reference: Sacred Text / Source | link |
| 10 | Ritual Playlist | link |
| 11 | Voice Reflections | audio |
| 12 | Ritual Notes | text |
| 13 | Photos | image |
| 14 | Follow-Up | checklist (7 items) |

### Adding a new template
1. Add an entry to `TEMPLATES` in `components/HubForm.tsx`
2. Define a `YOUR_TEMPLATE_BLOCKS` const (see `RITUAL_BLOCKS` for the pattern)
3. In the `applyTemplate()` `onConfirm` handler, add a case calling `Promise.all(YOUR_TEMPLATE_BLOCKS.map(...))`
4. All block inserts must use `fetch('/api/hub/${id}/content_blocks', { method: 'POST' })`

## Sort order

`moveBlock()` in `ContentBlocksEditor.tsx` swaps by array index and normalizes all sort_orders to `0, 1, 2, …` on every move. This heals gaps or duplicates from partial template inserts. Only changed blocks are PATCHed.

New blocks are inserted with `sort_order: blocks.length`.

## HubForm edit mode

Edit page uses Content / Settings tabs (`activeTab` state). Content tab renders `<ContentBlocksEditor hubId={hub.id} hubTitle={hub.title} />`. Settings tab has the form fields.

The `✓ Saved` chip appears for 2.5s after a block is updated (`savedBlockId` state).

## Help system

- `/help` — in-app help page (no auth required), linked from dashboard header
- `HELP.md` — developer reference in repo root

Both files must stay template-agnostic in general sections. Template-specific content belongs only inside the per-template section.

## Known Next.js 16 notes

- `middleware.ts` is renamed to `proxy.ts` and exports `proxy()` not `middleware()`
- Route params are Promises: `const { id } = await params` in server components
- `cookies()` is async: `const cookieStore = await cookies()`

## Not yet built

- Free tier enforcement (3 hubs / 1 collection limits)
- Paid feature: `hide_footer` flag to remove footer branding on public hubs
- Multi-user URL path: `/h/[slug]` → `/h/[username]/[slug]` (deferred until before real users print QR codes)
- Sort order normalization on load (gaps only heal on first move, not on page load)
- More templates beyond Blank, Artwork Archive, Ritual Template, Recipe
