# QRMagNotes — Help & Reference

## How it works

Each hub has a permanent URL at `/h/[slug]`. You print a QR code pointing to that URL and attach it to something physical — artwork, a ritual space, a jar, a journal. The content behind the QR can be updated at any time without reprinting.

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
{ "label": "Ritual Overview", "text": "...", "date": "2026-05-25" }

// checklist
{ "label": "Ritual Setup", "items": [{ "id": "rs-1", "text": "Cleanse the space" }] }

// audio
{ "label": "Voice Reflections", "url": "https://...", "date": "2026-05-25" }

// link
{ "label": "Ritual Playlist", "url": "https://spotify.com/..." }

// phone
{ "label": "Support Line", "url": "+1-555-000-0000" }

// file
{ "label": "Ceremony Guide", "url": "https://..." }

// image
{ "url": "https://...", "caption": "Altar setup" }

// timeline
{ "label": "Ritual History", "events": [{ "id": "e1", "date": "Samhain 2024", "text": "First working" }] }
```

---

## Ceremonial text styling

Any `text` block whose label contains one of these words renders in **italic** with a thin accent-colored left border (like a blockquote):

```
invocation  |  words to speak  |  quote  |  passage  |  poem  |  prayer  |  sacred
```

Matching is case-insensitive and partial (`isCeremonial()` in `components/HubView.tsx`).

---

## Default collapse state

On the public hub view, collapsible sections open/close based on label keyword matching (`defaultOpen()` in `components/HubView.tsx`):

| State | Label contains |
|-------|---------------|
| Open by default | `overview`, `step`, `note`, `invocation`, `words` |
| Closed by default | `setup`, `correspond`, `photo`, `memor`, `follow`, `playlist`, `voice` |
| Open (fallback) | everything else |

---

## Templates

### Blank (`blank`)
Empty hub. No pre-built blocks. Blue default theme.

### Artwork Memory Hub (`artwork`)
Pre-fills: title "Artwork Memory Hub", violet theme (`#8B5CF6`).  
No pre-built content blocks — add manually.  
Suggested blocks: Link (Spotify Playlist, Artist Notes), Text (Creative Process, Inspiration), Image (Process Photos), Audio (Artist Reflection).

### Ritual Template (`ritual`)
Pre-fills: title "My Ritual", description, violet theme (`#8B5CF6`).  
Creates **11 content blocks** via `Promise.all` to the API route (RLS requires server-side auth context; direct client inserts fail silently).

| # | Label | Type | Notes |
|---|-------|------|-------|
| 1 | Ritual Overview | text | Name, date/season/moon phase, intention, location, participants |
| 2 | Ritual Setup | checklist | 8 steps: cleanse, altar, candles, herbs/crystals, music, tools, silence phone, ground |
| 3 | Correspondences | text | Colors, herbs, crystals, elements, deities, symbols, offerings, tarot cards |
| 4 | Ritual Steps | checklist | 11 steps: opening → main working → meditation → offerings → closing → grounding |
| 5 | Invocation / Words to Speak | text | Ceremonial styling (italic + accent border) |
| 6 | Quote / Passage | text | Ceremonial styling (italic + accent border) |
| 7 | Ritual Playlist | link | Spotify or any music URL |
| 8 | Voice Reflections | audio | Voice note recorded during or after ritual |
| 9 | Ritual Notes | text | Guided prompts: energy, shifts, signs, emotions, lessons, next time |
| 10 | Photos | image | Altar or ritual photos |
| 11 | Follow-Up | checklist | 7 actions: journal, offerings, cleanup, photos, tarot record, watch for signs, revisit |

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
