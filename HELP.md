# QRMagNotes — Help & Reference

## How it works

Each hub has a permanent URL at `/h/[slug]`. You print a QR code pointing to that URL and attach it to something physical — a product, an artwork, a piece of equipment, a property, a vehicle, or any physical space. The content behind the QR can be updated at any time without reprinting.

**Hub modes:**
- `landing` — Shows a content page with blocks
- `redirect` — Instantly sends visitors to another URL (no page shown)

**Privacy levels:**
- `public` — Anyone can find and view
- `unlisted` — Only people with the link can view
- `private` — Only the owner when signed in

---

## Block types

| Type | What it does |
|------|-------------|
| `text` | Written notes, reflections, instructions. Supports optional label and date. Whitespace-preserved. |
| `checklist` | Tap-to-complete list. Checked state stored in **browser localStorage** (per-device, not DB). "Begin again" resets. |
| `audio` | Embedded audio player for any hosted URL. Optional label and recording date. |
| `link` | Tappable row linking to an external URL. Opens in new tab. |
| `phone` | Tap-to-call row. Opens device dialer. |
| `file` | Downloadable file from any public URL. |
| `image` | Inline photo from any public URL. Optional caption. |
| `timeline` | Vertical sequence of dated events with accent-color dot markers. |

### Data shape per block type

All blocks are stored in `content_blocks` as `type` + `data` (JSONB) + `sort_order`.

```json
// text
{ "label": "Product Overview", "text": "...", "date": "2026-05-25" }

// checklist
{ "label": "Setup Steps", "items": [{ "id": "s-1", "text": "Step one" }] }

// audio
{ "label": "Welcome Message", "url": "https://...", "date": "2026-05-25" }

// link
{ "label": "Product Page", "url": "https://example.com/..." }

// phone
{ "label": "Support Line", "url": "+1-555-000-0000" }

// file
{ "label": "User Manual", "url": "https://..." }

// image
{ "url": "https://...", "caption": "Product photo" }

// timeline
{ "label": "Service History", "events": [{ "id": "e1", "date": "2024-01-15", "text": "Oil change" }] }
```

---

## Styled quote / passage text

Any `text` block whose label contains one of these words renders in **italic** with a thin accent-colored left border — useful for quotes, poetry, featured passages, spoken text, or any content that should feel set apart from body copy:

```
invocation  |  words to speak  |  quote  |  passage  |  poem  |  prayer  |  sacred
```

Matching is case-insensitive and partial (`isCeremonial()` in `components/HubView.tsx`).

---

## Default collapse state

On the public hub view, every block is collapsible. The initial open/closed state when the page loads is determined by keyword matching against the block's label (`defaultOpen()` in `components/HubView.tsx`):

| State | Label contains |
|-------|---------------|
| Open by default | `overview`, `step`, `note`, `invocation`, `words` |
| Closed by default | `setup`, `correspond`, `photo`, `memor`, `follow`, `playlist`, `voice` |
| Open (fallback) | everything else |

Matching is case-insensitive and partial (`l.includes(...)`). A label not matching any keyword defaults to open.

To control the collapse state of any block, include or avoid the relevant keyword in its label. For example, naming a block "Ritual Setup" starts it closed (matches `setup`); naming it "Ritual Steps" starts it open (matches `step`).

---

## Templates

### Blank (`blank`)
Empty hub. No pre-built blocks. Blue default theme.

### Artwork Archive (`artwork`)
Pre-fills: title "Untitled Artwork", violet theme (`#8B5CF6`).  
Creates **8 content blocks** via `Promise.all` to the API route.

| # | Label | Type | Notes |
|---|-------|------|-------|
| 1 | *(no label)* | image | Main photo — upload or paste URL |
| 2 | Description | text | Short description or context |
| 3 | Details | text | Pre-filled: Date Created, Medium, Dimensions, Status (In Progress / Completed / Sold / Gifted) |
| 4 | Color Palette | text | Comma-separated colors |
| 5 | Inspiration / Meaning | text | Multiline — story, symbols, meaning |
| 6 | *(no label)* | image | Additional photos (caption: "Additional photos") |
| 7 | Music / Playlist | link | Starts closed (label matches `playlist`) |
| 8 | Notes | text | Starts open (label matches `note`) |

### Ritual Template (`ritual`)
Pre-fills: title "My Ritual", description, violet theme (`#8B5CF6`).  
Creates **14 content blocks** via `Promise.all` to the API route (RLS requires server-side auth context; direct client inserts fail silently).

| # | Label | Type | Notes |
|---|-------|------|-------|
| 1 | Ritual Overview | text | Name, date/season/moon phase, intention, location, participants |
| 2 | Ritual Setup | checklist | 8 steps: cleanse, altar, candles, herbs/crystals, music, tools, silence phone, ground |
| 3 | Correspondences | text | Colors, herbs, crystals, elements, deities, symbols, offerings, tarot cards |
| 4 | Ritual Steps | checklist | 11 steps: opening → main working → meditation → offerings → closing → grounding |
| 5 | Invocation / Words to Speak | text | Ceremonial styling (italic + accent border) |
| 6 | Quote / Passage | text | Ceremonial styling (italic + accent border) |
| 7 | Reference: Moon & Seasons | link | Blank — fill in preferred moon calendar or seasonal reference |
| 8 | Reference: Herb & Correspondences | link | Blank — fill in preferred herb/crystal/element guide |
| 9 | Reference: Sacred Text / Source | link | Blank — fill in source text, tradition resource, or citation |
| 10 | Ritual Playlist | link | Spotify or any music URL |
| 11 | Voice Reflections | audio | Voice note recorded during or after ritual |
| 12 | Ritual Notes | text | Guided prompts: energy, shifts, signs, emotions, lessons, next time |
| 13 | Photos | image | Altar or ritual photos |
| 14 | Follow-Up | checklist | 7 actions: journal, offerings, cleanup, photos, tarot record, watch for signs, revisit |

### Recipe (`recipe`)
Pre-fills: title "My Recipe", orange theme (`#F97316`).  
Creates **8 content blocks** via `Promise.all` to the API route.

| # | Label | Type | Notes |
|---|-------|------|-------|
| 1 | *(no label)* | image | Recipe photo — upload or paste URL |
| 2 | Description | text | Short intro or context |
| 3 | At a Glance | text | Pre-filled: Prep Time, Cook Time, Servings |
| 4 | Ingredients | text | Freeform multiline — one ingredient per line or freeform |
| 5 | Instructions | text | Freeform multiline — step-by-step method |
| 6 | Notes | text | Tips, substitutions, variations, storage |
| 7 | Video | link | Optional — YouTube, TikTok, etc. |
| 8 | Source | link | Optional — original recipe URL |

All 8 blocks start **open by default** (none of their labels match a closed keyword).

---

## Public view design notes

**File:** `components/HubView.tsx` (client component)  
**Page:** `app/h/[slug]/page.tsx` (server component — fetches data, passes props to HubView)

- Background: `#FAF9F7` (warm cream)
- Stone color palette throughout (`stone-*` classes)
- Blocks render as hairline-separated rows (`divide-y divide-stone-100`), not stacked cards
- Collapsed: `text-sm font-medium text-stone-500`, `py-3`, quiet
- Expanded: `font-semibold text-stone-800`, content indented `pl-6`
- Checklist: 8px circle bullets (no checkbox box)
- Link/phone/file: quiet text rows with small accent icon + arrow, no button styling
- Image blocks: edge-to-edge within column, `rounded-xl`
- Timeline: thin accent-color vertical line, tiny dots with box-shadow ring

---

## Adding a new template

1. Add an entry to `TEMPLATES` array in `components/HubForm.tsx`
2. If it needs pre-built blocks, define a `YOUR_TEMPLATE_BLOCKS` const (see `RITUAL_BLOCKS` for the pattern)
3. In the `applyTemplate()` function's `onConfirm` handler, add a case that calls `Promise.all(YOUR_TEMPLATE_BLOCKS.map(...))`
4. Block inserts must go through `fetch('/api/hub/${newHub.id}/content_blocks', { method: 'POST' })` — not direct Supabase client calls — due to RLS requiring server-side auth context

---

## Known issues / deferred

- **Sort order gaps**: If a block insert fails (e.g., during bulk template creation), sort_order numbering can have gaps. When two blocks share the same sort_order, `moveBlock()` swaps equal values and does nothing. Fix: normalize sort_orders after every move (reassign 0,1,2,… from array position). Deferred — only manifests after a failed partial template insert.
- **Multi-user slugs**: Current URL is `/h/[slug]`. Future plan: `/h/[username]/[slug]` for multi-tenant. Deferred until before real users print QR codes.
- **Free tier limits**: 3 hubs / 1 collection not yet enforced.
- **Image uploads**: Supported directly from the image block editor. Uploaded files are stored in Supabase Storage. A public URL can also be pasted instead.
