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

## Dashboard & folders

The dashboard (`/dashboard`) shows all your hubs as a flat list sorted by most recently updated. Above the list is a collapsible **Folders** section.

**Folders:**
- Click **▼ Show** to expand the Folders section; each folder row shows a name and hub count.
- Click a folder name to filter the flat list to only that folder's hubs. A blue banner appears showing the active folder; click **Show all ×** to clear.
- Use **+ Hub** on any folder row to create a new hub pre-assigned to that folder.
- A default "My Hubs" folder is created automatically on first login if you have none.

**Assigning a hub to a folder:**
- At creation time: a Folder selector appears right after the slug field.
- After creation: each hub card has a small `📁 folder name` dropdown — tap it to move the hub without going into Settings.
- In hub Settings tab: full Folder dropdown with a **+ New** button to create a folder inline.

**Hub type badge:**
- When creating a hub from a template, the template name (e.g. "🐾 Pet Profile") appears as a badge on the dashboard card.
- For hubs created from Blank, or to re-label any hub, go to the hub's **Settings tab → Hub type** dropdown. Changing this adds the badge only — it does not add or remove content blocks.

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

### Book / Reading Notes (`book`)
Pre-fills: title "My Reading Notes", violet theme (`#8B5CF6`).  
Creates **7 content blocks** via `Promise.all` to the API route.

| # | Label | Type | Notes |
|---|-------|------|-------|
| 1 | *(no label)* | image | Book cover photo |
| 2 | Book Summary | text | Pre-filled: Title, Author, Genre, Year Published, Date Read, Rating, Summary |
| 3 | Favorite Quotes | text | Passages worth keeping |
| 4 | Reading Reflection | audio | Voice thoughts while reading or after finishing |
| 5 | Author / Purchase Link | link | Author site, Goodreads, or purchase page |
| 6 | Reading Progress | timeline | Start/pause/resume/finish log |
| 7 | Thoughts & Insights | text | Deeper reflections, connections, things to act on |

### Daily Reflection / Journal (`journal`)
Pre-fills: title "My Journal", teal theme (`#14B8A6`).  
Creates **6 content blocks** via `Promise.all` to the API route.

| # | Label | Type | Notes |
|---|-------|------|-------|
| 1 | Daily Reflection | text | Freeform thoughts, feelings, observations |
| 2 | *(no label)* | image | Photo of the day |
| 3 | Voice Journal | audio | Spoken entry — what happened, how you felt |
| 4 | Important Moments | timeline | Significant moments as they happen |
| 5 | Daily Intentions | checklist | 3 items: Set intention, Prioritize top 3, End-of-day reflection |
| 6 | Additional Thoughts | text | Anything else worth capturing |

### Goal / Habit Tracker (`goal`)
Pre-fills: title "My Goal", rose theme (`#F43F5E`).  
Creates **6 content blocks** via `Promise.all` to the API route.

| # | Label | Type | Notes |
|---|-------|------|-------|
| 1 | Goal Overview | text | Pre-filled: Goal, Why This Matters, Target Date, Success Looks Like |
| 2 | Habit Checklist | checklist | 4 items: Morning routine, Exercise, Read/learn, Evening reflection |
| 3 | Progress Log | timeline | Milestones, breakthroughs, and setbacks |
| 4 | Progress Update | audio | Quick check-in voice note |
| 5 | Related Resource | link | Optional book, course, or article |
| 6 | Wins & Challenges | text | What's working and what isn't |

### Home Maintenance Log (`maintenance`)
Pre-fills: title "My Maintenance Log", teal theme (`#14B8A6`).  
Creates **8 content blocks** via `Promise.all` to the API route.

| # | Label | Type | Notes |
|---|-------|------|-------|
| 1 | *(no label)* | image | Appliance or area photo |
| 2 | Maintenance Information | text | Pre-filled: Item/Area, Brand/Model, Serial Number, Installed, Warranty Expiration |
| 3 | Maintenance Tasks | checklist | 5 items: Inspect, Clean filters, Test, Check leaks, Schedule service |
| 4 | Repair History | timeline | All repairs and service visits |
| 5 | Manuals & Warranty | file | Manual and warranty document |
| 6 | Service Contact | phone | Tap-to-call repair line |
| 7 | Product Page | link | Optional product or parts page |
| 8 | Additional Notes | text | Other notes |

### Pet Profile (`pet`)
Pre-fills: title "My Pet", amber theme (`#F59E0B`).  
Creates **8 content blocks** via `Promise.all` to the API route.

| # | Label | Type | Notes |
|---|-------|------|-------|
| 1 | *(no label)* | image | Pet photos |
| 2 | Pet Information | text | Pre-filled: Name, Species/Breed, Date of Birth, Markings, Microchip/ID # |
| 3 | Care Tasks | checklist | 5 items: Morning feed, Evening feed, Water, Exercise/walk, Grooming |
| 4 | Vet & Health History | timeline | Vet visits, medications, illnesses |
| 5 | Veterinarian | phone | Tap-to-call vet number |
| 6 | Vaccination Records | file | Vaccination and health certificates |
| 7 | Pet Update | audio | Quick voice update on how the pet is doing |
| 8 | Behavior / Preferences | text | Quirks, favorites, training notes, dietary restrictions |

### Plant Profile (`plant`)
Pre-fills: title "My Plant", green theme (`#22C55E`).  
Creates **8 content blocks** via `Promise.all` to the API route.

| # | Label | Type | Notes |
|---|-------|------|-------|
| 1 | *(no label)* | image | Plant photo |
| 2 | Plant Information | text | Pre-filled: Name, Species, Date Acquired, Where From, Pot Size |
| 3 | Care Instructions | text | Pre-filled: Watering, Light, Soil, Temperature, Humidity, Fertilizing, Repotting |
| 4 | Care Checklist | checklist | 5 items: Water, Check soil, Check pests, Wipe leaves, Rotate |
| 5 | Growth & Care Log | timeline | Log milestones and care events |
| 6 | Plant Update | audio | Voice update about the plant |
| 7 | Care Guide | link | Optional care guide or species reference |
| 8 | Seasonal Notes | text | Seasonal care adjustments |

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

### Travel Journal (`travel`)
Pre-fills: title "My Trip", blue theme (`#3B82F6`).  
Creates **7 content blocks** via `Promise.all` to the API route.

| # | Label | Type | Notes |
|---|-------|------|-------|
| 1 | *(no label)* | image | Trip photos |
| 2 | Trip Overview | text | Pre-filled: Destination, Dates, Traveling With, Accommodation, Purpose |
| 3 | Travel Timeline | timeline | Day-by-day events and destinations |
| 4 | Maps / Reservations | link | Maps, bookings, or itineraries |
| 5 | Packing List | checklist | 6 items: Passport/ID, Phone+charger, Medications, Insurance, Cash/cards, Shoes |
| 6 | Travel Reflection | audio | Voice reflection from the road or after returning |
| 7 | Recommendations | text | Restaurants, places, tips to remember |

### What's in the Box? (`box`)
Pre-fills: title "My Box", slate theme (`#64748B`).  
Creates **8 content blocks** via `Promise.all` to the API route.

| # | Label | Type | Notes |
|---|-------|------|-------|
| 1 | *(no label)* | image | Box photo |
| 2 | Quick Description | text | One-line summary |
| 3 | Contents | checklist | Empty — user adds items |
| 4 | Storage Location | text | Where the box lives |
| 5 | Box Overview | audio | Audio walkthrough of contents |
| 6 | Added / Removed Items | timeline | Log changes over time |
| 7 | Manuals or Documents | file | Related documents |
| 8 | Additional Notes | text | Condition, fragile warnings, etc. |

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
2. Define a `YOUR_TEMPLATE_BLOCKS` const (follow `RECIPE_BLOCKS` as a simple pattern) — place it **before** `BLOCKS_BY_TEMPLATE` to avoid TypeScript forward-reference errors
3. Add `your_id: YOUR_TEMPLATE_BLOCKS` to the `BLOCKS_BY_TEMPLATE` record
4. Add a tag placeholder string to `TAG_PLACEHOLDERS` record
5. Add audio suggestions array to `AUDIO_SUGGESTIONS` in `ContentBlocksEditor.tsx`
6. Add checklist label placeholder to `CHECKLIST_LABEL_PLACEHOLDER` in `ContentBlocksEditor.tsx`

Block inserts run automatically via `handleSubmit` — no per-template branching. All inserts go through `fetch('/api/hub/${newHub.id}/content_blocks', { method: 'POST' })` due to RLS requiring server-side auth context.

---

## Content block indicators

In the block editor, each block row shows a small dot on the left:
- **Solid green dot** — the block has content (text entered, URL filled, items or events added)
- **Hollow gray ring** — the block is empty
- Empty block rows also render on a light gray background as an additional visual cue

This makes it easy to scan the editor and see what still needs to be filled in after applying a template.

---

## Known issues / deferred

- **Sort order gaps**: If a block insert fails (e.g., during bulk template creation), sort_order numbering can have gaps. When two blocks share the same sort_order, `moveBlock()` swaps equal values and does nothing. Fix: normalize sort_orders after every move (reassign 0,1,2,… from array position). Deferred — only manifests after a failed partial template insert.
- **Multi-user slugs**: Current URL is `/h/[slug]`. Future plan: `/h/[username]/[slug]` for multi-tenant. Deferred until before real users print QR codes.
- **Free tier limits**: Hub and folder limits not yet enforced.
- **Image uploads**: Supported directly from the image block editor. Uploaded files are stored in Supabase Storage. A public URL can also be pasted instead.
