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
  login/page.tsx                     — email + Google auth (email login works; email signup grayed out pending SMTP)
  signup/page.tsx                    — Google auth only; email form disabled pending SMTP setup
  setup/page.tsx                     — username picker; shown once after first login (when username_confirmed=false); redirects to /dashboard on confirm
  auth/callback/route.ts             — OAuth callback handler
  help/page.tsx                      — in-app help & reference page (no auth required)
  dashboard/collections/page.tsx     — main dashboard (flat hub list primary; Folders section collapsible above list; auto-creates "My Hubs" folder on first load)
  dashboard/hub/new/page.tsx         — create hub (template picker → form → ContentBlocksEditor)
  dashboard/hub/[id]/edit/page.tsx   — edit hub (Content tab + Settings tab)
  dashboard/hub/[id]/print/page.tsx  — print QR card
  h/[username]/[slug]/page.tsx       — public hub page (server component, passes to HubView)

components/
  HubCard.tsx              — dashboard card; template badge, inline folder <select>, Edit/View/Copy/QR/Print buttons
  HubForm.tsx              — create/edit form; TEMPLATES array; BLOCKS_BY_TEMPLATE map; RITUAL_BLOCKS + 10 other *_BLOCKS consts; tabs on edit (Content / Settings)
  HubView.tsx              — PUBLIC hub renderer (client component); all interactive logic
  ContentBlocksEditor.tsx  — block editor (add/edit/delete/reorder); green dot = has content, hollow ring = empty
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
- **hubs** — owned by user; publicly readable for `/h/[slug]`; columns include `collection_id` (FK → collections), `privacy_mode`, `tags text[]`, `template_id text`
- **collections** — user-owned folders; hubs.collection_id references this
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

**Hub type (`template_id`):**
Stored as a text column on hubs. Set automatically when a hub is created from a template. Can also be set retroactively in the hub's Settings tab → "Hub type" dropdown — this only adds the badge label on the dashboard card; it does not add or remove content blocks.

**Folders (formerly "Collections"):**
- All user-facing text says "Folder". The DB table is still named `collections` and the FK is still `collection_id`.
- Dashboard shows a flat hub list as primary view; Folders section is collapsible and appears above the list.
- Clicking a folder name filters the flat list to that folder's hubs.
- Each HubCard has an inline folder `<select>` for quick assignment without going to Settings.
- First login auto-creates a "My Hubs" folder if the user has none.

The QR code always points to `/h/[username]/[slug]`. The slug is permanent — changing it breaks printed QR codes. The username is derived from the user's email prefix and stored on the `profiles` table.

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

Defined in `TEMPLATES` array in `components/HubForm.tsx`. Template picker shown before create form. All blocks are created via `BLOCKS_BY_TEMPLATE` record in `handleSubmit` — no per-template branching needed.

**12 templates:** Blank, Artwork Archive (8 blocks), Ritual (14 blocks), Recipe (8 blocks), What's in the Box? (8 blocks), Plant Profile (8 blocks), Home Maintenance Log (8 blocks), Travel Journal (7 blocks), Pet Profile (8 blocks), Book / Reading Notes (7 blocks), Goal / Habit Tracker (6 blocks), Daily Reflection / Journal (6 blocks).

See `HELP.md` for the full block-by-block breakdown of each template.

### Adding a new template
1. Add an entry to `TEMPLATES` in `components/HubForm.tsx`
2. Define a `YOUR_TEMPLATE_BLOCKS` const (follow `RITUAL_BLOCKS` or `RECIPE_BLOCKS` as pattern) — place it **before** `BLOCKS_BY_TEMPLATE` to avoid forward-reference errors
3. Add `your_id: YOUR_TEMPLATE_BLOCKS` to the `BLOCKS_BY_TEMPLATE` record
4. Add a tag placeholder to `TAG_PLACEHOLDERS` record
5. Add audio label suggestions to `AUDIO_SUGGESTIONS` in `ContentBlocksEditor.tsx`
6. Add checklist label placeholder to `CHECKLIST_LABEL_PLACEHOLDER` in `ContentBlocksEditor.tsx`
7. All block inserts use `fetch('/api/hub/${newHub.id}/content_blocks', { method: 'POST' })` automatically via the map in `handleSubmit`

## Sort order

`moveBlock()` in `ContentBlocksEditor.tsx` swaps by array index and normalizes all sort_orders to `0, 1, 2, …` on every move. This heals gaps or duplicates from partial template inserts. Only changed blocks are PATCHed.

New blocks are inserted with `sort_order: blocks.length`.

## HubForm edit mode

Edit page uses Content / Settings tabs (`activeTab` state). Content tab renders `<ContentBlocksEditor hubId={hub.id} hubTitle={hub.title} />`. Settings tab has all hub fields including Folder, Hub type (template_id dropdown), title, slug, mode, visibility, tags, description, image, theme color.

The `✓ Saved` chip appears for 2.5s after a block is updated (`savedBlockId` state).

## ContentBlocksEditor

Block rows show a **content indicator dot**: solid green (`bg-emerald-400`) if the block has content, hollow gray ring (`border border-gray-300`) if empty. Empty block rows also render on `bg-gray-50` instead of white.

`blockHasContent(block)` function in `ContentBlocksEditor.tsx` determines this by checking:
- `text/audio/link/phone/file` → `data.url` or `data.text` is non-empty
- `checklist` → `data.items.length > 0`
- `timeline` → `data.events.length > 0`
- `image` → `data.url` is non-empty

## Help system

- `/help` — in-app help page (no auth required), linked from dashboard header
- `HELP.md` — developer reference in repo root

Both files must stay template-agnostic in general sections. Template-specific content belongs only inside the per-template section.

## Known Next.js 16 notes

- `middleware.ts` is renamed to `proxy.ts` and exports `proxy()` not `middleware()`
- Route params are Promises: `const { id } = await params` in server components
- `cookies()` is async: `const cookieStore = await cookies()`

## Not yet built

- SMTP configuration: email signup works but confirmation emails are not delivered — Supabase project needs a custom SMTP provider configured (Authentication → Settings → SMTP in the Supabase dashboard). Without this, only OAuth (Google) signup works reliably. Email signup is grayed out on the signup page until this is resolved.
- Free tier enforcement (hub/folder limits)
- Paid feature: `hide_footer` flag to remove footer branding on public hubs
- Sort order normalization on load (gaps only heal on first move, not on page load)

## DB migrations applied (Supabase SQL editor)

Beyond the base schema in `supabase/schema.sql`, these have been applied to the live project:

```sql
alter table public.hubs add column if not exists collection_id uuid references public.collections(id) on delete set null;
alter table public.hubs add column if not exists privacy_mode text not null default 'public' check (privacy_mode in ('public', 'unlisted', 'private'));
alter table public.hubs add column if not exists tags text[] not null default '{}';
alter table public.hubs add column if not exists template_id text;
ALTER TABLE public.content_blocks DROP CONSTRAINT IF EXISTS content_blocks_type_check;
ALTER TABLE public.content_blocks ADD CONSTRAINT content_blocks_type_check
  CHECK (type IN ('text', 'image', 'audio', 'file', 'link', 'phone', 'checklist', 'timeline', 'note'));
```

**Still needs to be run** (username + per-user slug uniqueness):

```sql
-- Add username to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;

UPDATE public.profiles
SET username = REGEXP_REPLACE(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(SPLIT_PART(email, '@', 1)), '[^a-z0-9-]+', '-', 'g')), '-+', '-', 'g')
WHERE username IS NULL;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Update signup trigger to auto-set username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    new.id,
    new.email,
    REGEXP_REPLACE(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(SPLIT_PART(new.email, '@', 1)), '[^a-z0-9-]+', '-', 'g')), '-+', '-', 'g')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow public read of profiles (username appears in public hub URLs)
CREATE POLICY "Anyone can read profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- Change hub slug uniqueness: global → per-user
ALTER TABLE public.hubs DROP CONSTRAINT IF EXISTS hubs_slug_key;
ALTER TABLE public.hubs ADD CONSTRAINT hubs_slug_user_unique UNIQUE (user_id, slug);

-- Username confirmation flag (used by /setup page)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username_confirmed boolean NOT NULL DEFAULT false;
-- Mark existing users as already confirmed (they went through the migration)
UPDATE public.profiles SET username_confirmed = true WHERE username IS NOT NULL;
```
