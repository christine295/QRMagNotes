import Link from 'next/link'

const BLOCK_TYPES = [
  {
    name: 'Text / Note',
    description: 'Written content — overviews, instructions, descriptions, FAQs, notes. Supports multi-line whitespace-preserved text. Accepts an optional label and date.',
    examples: 'product overviews, care instructions, artist statements, property notes, service descriptions, how-to guides',
  },
  {
    name: 'Checklist',
    description: 'Step-by-step list with tap-to-complete items. Checked state is stored locally per device — each visitor tracks their own progress independently. "Begin again" resets all items.',
    examples: 'setup steps, maintenance checklists, packing lists, onboarding flows, inspection notes, house rules',
  },
  {
    name: 'Audio / Voice Note',
    description: 'Embedded audio player for any hosted audio URL. Supports an optional label and recording date. Record directly in the editor or upload a file.',
    examples: 'welcome messages, voice instructions, property tours, product demonstrations, narrated context',
  },
  {
    name: 'Link',
    description: 'A tappable external URL row — opens in a new tab. The label is shown instead of the raw URL.',
    examples: 'websites, booking pages, product listings, maps, playlists, reference guides, support portals, documentation',
  },
  {
    name: 'Phone',
    description: 'A tap-to-call phone number. Tapping opens the device dialer.',
    examples: 'support lines, contact numbers, service providers, emergency contacts, reservation lines',
  },
  {
    name: 'File',
    description: 'A downloadable file from any publicly hosted URL (PDF, doc, etc.). Shown as a tappable row with a label.',
    examples: 'care guides, user manuals, warranties, floor plans, menus, spec sheets, printable forms',
  },
  {
    name: 'Image',
    description: 'An inline photo uploaded directly or linked from a public URL. Displayed within the content column with an optional caption.',
    examples: 'product photos, before/after shots, diagrams, artwork, property exteriors, team photos, instructional images',
  },
  {
    name: 'Timeline',
    description: 'A vertical sequence of dated entries with accent-color dot markers. Each entry has an optional date and a text description.',
    examples: 'service history, project milestones, renovation log, ownership history, product lineage, event sequence',
  },
]

const TEMPLATES = [
  {
    name: 'Blank',
    emoji: '➕',
    description: 'Empty hub. No pre-built blocks. Use this when starting something that doesn\'t fit an existing template, or when building a custom structure from scratch.',
    blocks: [],
    themeColor: '#3B82F6',
  },
  {
    name: 'Artwork Archive',
    emoji: '🎨',
    description: 'Document and archive your artwork — photos, materials, story, and status. Violet theme. Attach to the back of a painting or piece of art, or use as a standalone record.',
    themeColor: '#8B5CF6',
    blocks: [
      { label: '(Main Photo)', type: 'Image', note: 'Primary photo of the artwork — upload or paste a public URL' },
      { label: 'Description', type: 'Text', note: 'A short description or context for the piece' },
      { label: 'Details', type: 'Text', note: 'Pre-filled: Date Created, Medium, Dimensions, and Status (In Progress / Completed / Sold / Gifted)' },
      { label: 'Color Palette', type: 'Text', note: 'Comma-separated colors used in the piece — e.g. burnt sienna, cobalt blue, ivory' },
      { label: 'Inspiration / Meaning', type: 'Text', note: 'The story, symbols, or meaning behind the work — supports multiline text' },
      { label: '(Additional Photos)', type: 'Image', note: 'Process shots, detail photos, or alternate views' },
      { label: 'Music / Playlist', type: 'Link', note: 'Optional — Spotify, YouTube, or any playlist URL. Starts collapsed by default.' },
      { label: 'Notes', type: 'Text', note: 'Any other notes — materials sourced, exhibition history, ideas for next time' },
    ],
  },
  {
    name: 'Book / Reading Notes',
    emoji: '📖',
    description: 'Save notes, quotes, and reflections about a book. Violet theme.',
    themeColor: '#8B5CF6',
    blocks: [
      { label: '(Photo)', type: 'Image', note: 'Photo of the book cover' },
      { label: 'Book Summary', type: 'Text', note: 'Pre-filled: Title, Author, Genre, Year Published, Date Read, Rating, Summary' },
      { label: 'Favorite Quotes', type: 'Text', note: 'Passages or quotes worth keeping' },
      { label: 'Reading Reflection', type: 'Voice Note', note: 'Record your thoughts while reading or after finishing' },
      { label: 'Author / Purchase Link', type: 'Link', note: 'Link to the author\'s site, Goodreads, or a purchase page' },
      { label: 'Reading Progress', type: 'Timeline', note: 'Log when you started, paused, resumed, and finished' },
      { label: 'Thoughts & Insights', type: 'Text', note: 'Deeper reflections, connections to other books, things to act on' },
    ],
  },
  {
    name: 'Daily Reflection / Journal',
    emoji: '📓',
    description: 'A daily space for reflection, voice notes, and intentions. Teal theme.',
    themeColor: '#14B8A6',
    blocks: [
      { label: 'Daily Reflection', type: 'Text', note: 'Freeform space for the day\'s thoughts, feelings, or observations' },
      { label: '(Photo)', type: 'Image', note: 'Photo of the day — optional' },
      { label: 'Voice Journal', type: 'Voice Note', note: 'Record a spoken entry — what happened, how you felt, what you noticed' },
      { label: 'Important Moments', type: 'Timeline', note: 'Log significant moments or events as they happen' },
      { label: 'Daily Intentions', type: 'Checklist', note: '3 starter intentions: Set intention, Prioritize top 3 tasks, End-of-day reflection' },
      { label: 'Additional Thoughts', type: 'Text', note: 'Anything else worth capturing before the day ends' },
    ],
  },
  {
    name: 'Goal / Habit Tracker',
    emoji: '🎯',
    description: 'Define a goal, track daily habits, and log progress. Rose theme.',
    themeColor: '#F43F5E',
    blocks: [
      { label: 'Goal Overview', type: 'Text', note: 'Pre-filled: Goal, Why This Matters, Target Date, Success Looks Like' },
      { label: 'Habit Checklist', type: 'Checklist', note: '4 starter habits: Morning routine, Exercise, Read/learn, Evening reflection' },
      { label: 'Progress Log', type: 'Timeline', note: 'Log milestones, breakthroughs, and setbacks over time' },
      { label: 'Progress Update', type: 'Voice Note', note: 'Record a quick check-in on how the goal is going' },
      { label: 'Related Resource', type: 'Link', note: 'Optional — a book, course, article, or tool related to this goal' },
      { label: 'Wins & Challenges', type: 'Text', note: 'Freeform space for what\'s working and what isn\'t' },
    ],
  },
  {
    name: 'Home Maintenance Log',
    emoji: '🔧',
    description: 'Log appliances, repairs, warranties, and service contacts. Teal theme. Attach to an appliance, breaker box, HVAC unit, or any area of the home.',
    themeColor: '#14B8A6',
    blocks: [
      { label: '(Photo)', type: 'Image', note: 'Photo of the appliance or area' },
      { label: 'Maintenance Information', type: 'Text', note: 'Pre-filled: Item/Area, Brand/Model, Serial Number, Installed, Warranty Expiration' },
      { label: 'Maintenance Tasks', type: 'Checklist', note: '5 starter tasks: Inspect, Clean filters, Test system, Check for leaks, Schedule service' },
      { label: 'Repair History', type: 'Timeline', note: 'Log all repairs and service visits over time' },
      { label: 'Manuals & Warranty', type: 'File/PDF', note: 'Upload or link the user manual and warranty document' },
      { label: 'Service Contact', type: 'Phone Number', note: 'Tap-to-call number for the repair company or service line' },
      { label: 'Product Page', type: 'Link', note: 'Optional — link to the product page or parts store' },
      { label: 'Additional Notes', type: 'Text', note: 'Any other notes about the item or area' },
    ],
  },
  {
    name: 'Pet Profile',
    emoji: '🐾',
    description: 'Track your pet with care tasks, health history, and vet info. Amber theme. Attach to a pet carrier, food station, or pet folder.',
    themeColor: '#F59E0B',
    blocks: [
      { label: '(Photo)', type: 'Image', note: 'Photos of your pet' },
      { label: 'Pet Information', type: 'Text', note: 'Pre-filled: Name, Species/Breed, Date of Birth, Color/Markings, Microchip/ID #' },
      { label: 'Care Tasks', type: 'Checklist', note: '5 starter tasks: Morning feeding, Evening feeding, Fresh water, Exercise/walk, Grooming' },
      { label: 'Vet & Health History', type: 'Timeline', note: 'Log vet visits, medications, illnesses, and health events' },
      { label: 'Veterinarian', type: 'Phone Number', note: 'Tap-to-call number for your vet' },
      { label: 'Vaccination Records', type: 'File/PDF', note: 'Upload vaccination and health certificates' },
      { label: 'Pet Update', type: 'Voice Note', note: 'Record a quick audio update about how your pet is doing' },
      { label: 'Behavior / Preferences', type: 'Text', note: 'Favorite things, quirks, training notes, dietary restrictions' },
    ],
  },
  {
    name: 'Plant Profile',
    emoji: '🪴',
    description: 'Track a plant with care instructions, growth log, and photos. Green theme. Attach to a pot or shelf tag.',
    themeColor: '#22C55E',
    blocks: [
      { label: '(Photo)', type: 'Image', note: 'Photo of the plant' },
      { label: 'Plant Information', type: 'Text', note: 'Pre-filled: Plant Name, Type/Species, Date Acquired, Where From, Pot Size' },
      { label: 'Care Instructions', type: 'Text', note: 'Pre-filled: Watering, Light, Soil, Temperature, Humidity, Fertilizing, Repotting' },
      { label: 'Care Checklist', type: 'Checklist', note: '5 starter tasks: Water, Check soil, Check for pests, Wipe leaves, Rotate' },
      { label: 'Growth & Care Log', type: 'Timeline', note: 'Log growth milestones, repotting, and care events over time' },
      { label: 'Plant Update', type: 'Voice Note', note: 'Record a quick audio update about how the plant is doing' },
      { label: 'Care Guide', type: 'Link', note: 'Optional — link to a care guide or species reference' },
      { label: 'Seasonal Notes', type: 'Text', note: 'Notes for spring/summer/fall/winter care adjustments' },
    ],
  },
  {
    name: 'Recipe',
    emoji: '🍳',
    description: 'A recipe hub with 8 pre-built blocks covering photo, description, timing, ingredients, instructions, notes, video, and source. Orange theme. Attach to a cookbook, a kitchen item, or share a family recipe via QR code.',
    themeColor: '#F97316',
    blocks: [
      { label: '(Photo)', type: 'Image', note: 'Recipe photo — upload directly or paste a public URL' },
      { label: 'Description', type: 'Text', note: 'A short intro or context for the recipe' },
      { label: 'At a Glance', type: 'Text', note: 'Pre-filled with Prep Time, Cook Time, and Servings fields' },
      { label: 'Ingredients', type: 'Text', note: 'Full ingredients list — one per line or freeform' },
      { label: 'Instructions', type: 'Text', note: 'Step-by-step method — freeform multiline text' },
      { label: 'Notes', type: 'Text', note: 'Tips, substitutions, variations, or storage notes' },
      { label: 'Video', type: 'Link', note: 'Optional — YouTube, TikTok, or any video URL' },
      { label: 'Source', type: 'Link', note: 'Optional — original recipe URL or credit' },
    ],
  },
  {
    name: 'Ritual Template',
    emoji: '🕯️',
    description: 'A complete ritual documentation hub with 14 pre-built blocks in ceremonial order. Violet theme. Drop into any ritual practice — adapt labels and content as needed.',
    themeColor: '#8B5CF6',
    blocks: [
      { label: 'Ritual Overview', type: 'Text', note: 'Name, date/season/moon phase, intention, location, participants' },
      { label: 'Ritual Setup', type: 'Checklist', note: '8 setup steps — cleanse space, prepare altar, gather tools, ground and center' },
      { label: 'Correspondences', type: 'Text', note: 'Colors, herbs, crystals, elements, deities, symbols, offerings, tarot cards' },
      { label: 'Ritual Steps', type: 'Checklist', note: '11 steps from opening through closing and final grounding' },
      { label: 'Invocation / Words to Speak', type: 'Text', note: 'Renders in italic with accent border — ceremonial text styling' },
      { label: 'Quote / Passage', type: 'Text', note: 'Renders in italic with accent border — for sacred text, poetry, or seasonal passages' },
      { label: 'Reference: Moon & Seasons', type: 'Link', note: 'Blank — fill in your preferred moon calendar or seasonal guide' },
      { label: 'Reference: Herb & Correspondences', type: 'Link', note: 'Blank — fill in your preferred herb, crystal, or element reference' },
      { label: 'Reference: Sacred Text / Source', type: 'Link', note: 'Blank — fill in a source text, tradition resource, or citation' },
      { label: 'Ritual Playlist', type: 'Link', note: 'Spotify or any music URL' },
      { label: 'Voice Reflections', type: 'Audio', note: 'Voice note recorded during or after ritual' },
      { label: 'Ritual Notes', type: 'Text', note: 'Guided reflection prompts — energy, shifts, signs, emotions, lessons' },
      { label: 'Photos', type: 'Image', note: 'Photos from this ritual' },
      { label: 'Follow-Up', type: 'Checklist', note: '7 follow-up actions — journaling, cleanup, recording divination, watching for signs' },
    ],
  },
  {
    name: 'Travel Journal',
    emoji: '✈️',
    description: 'Capture a trip with photos, timeline, packing list, and reflections. Blue theme.',
    themeColor: '#3B82F6',
    blocks: [
      { label: '(Photo)', type: 'Image', note: 'Photos from the trip' },
      { label: 'Trip Overview', type: 'Text', note: 'Pre-filled: Destination, Dates, Traveling With, Accommodation, Purpose of Trip' },
      { label: 'Travel Timeline', type: 'Timeline', note: 'Log destinations, events, and moments day by day' },
      { label: 'Maps / Reservations', type: 'Link', note: 'Link to maps, booking confirmations, or itineraries' },
      { label: 'Packing List', type: 'Checklist', note: '6 starter items: Passport/ID, Phone+charger, Medications, Travel insurance, Cash/cards, Shoes' },
      { label: 'Travel Reflection', type: 'Voice Note', note: 'Record a reflection from the road or after returning' },
      { label: 'Recommendations', type: 'Text', note: 'Restaurants, places, tips you want to remember or share' },
    ],
  },
  {
    name: "What's in the Box?",
    emoji: '📦',
    description: "Label a storage box with a photo, contents checklist, location, and notes. Slate theme. Print and attach a QR code to any box so you always know what's inside.",
    themeColor: '#64748B',
    blocks: [
      { label: '(Photo)', type: 'Image', note: 'Photo of the box or its contents' },
      { label: 'Quick Description', type: 'Text', note: 'One-line summary of what this box holds' },
      { label: 'Contents', type: 'Checklist', note: 'Add each item as a checklist entry' },
      { label: 'Storage Location', type: 'Text', note: 'Where the box lives — e.g. attic shelf 3, garage left wall' },
      { label: 'Box Overview', type: 'Voice Note', note: 'Optional audio walkthrough of the contents' },
      { label: 'Added / Removed Items', type: 'Timeline', note: 'Log changes to the box over time' },
      { label: 'Manuals or Documents', type: 'File/PDF', note: 'Any related documents stored with the box' },
      { label: 'Additional Notes', type: 'Text', note: 'Condition notes, fragile warnings, last opened date, etc.' },
    ],
  },
]

const COLLAPSE_BEHAVIOR = [
  { rule: 'Open by default', examples: 'overview, step, note, invocation, words' },
  { rule: 'Closed by default', examples: 'setup, correspond, photo, memor, follow, playlist, voice' },
  { rule: 'Open by default (fallback)', examples: 'everything else' },
]

const CEREMONIAL_LABELS = [
  'invocation', 'words to speak', 'quote', 'passage', 'poem', 'prayer', 'sacred',
]

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <header className="bg-white border-b border-stone-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
              ← Dashboard
            </Link>
            <h1 className="text-base font-semibold text-stone-900">Help & Reference</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-10 space-y-16">

        {/* How it works */}
        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-4">How QRMagNotes works</h2>
          <div className="prose-sm text-stone-600 leading-[1.7] space-y-3 max-w-prose">
            <p>
              Each hub has a permanent URL at <code className="text-stone-700 bg-stone-100 px-1 py-0.5 rounded text-xs">/h/your-slug</code>.
              You print a QR code pointing to that URL and attach it to something physical — a product, an artwork, a piece of equipment, a property, a vehicle, or any physical space.
              The content behind the QR can be updated at any time without reprinting the code.
            </p>
            <p>
              Hubs can operate in two modes: <strong>landing</strong> (shows a content page with blocks) or <strong>redirect</strong> (instantly sends visitors to another URL).
              Privacy can be set to public, unlisted (link-only), or private (owner-only).
            </p>
          </div>
        </section>

        {/* Dashboard & Folders */}
        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-4">Dashboard &amp; folders</h2>
          <div className="prose-sm text-stone-600 leading-[1.7] space-y-3 max-w-prose">
            <p>
              Your dashboard shows all hubs in a single flat list, sorted by most recently updated. A collapsible <strong>Folders</strong> section sits above the list — click a folder name to filter the list to just that folder's hubs, then <strong>Show all ×</strong> to clear the filter.
            </p>
            <p>
              <strong>Assigning a hub to a folder:</strong> At creation time the Folder selector appears just below the slug field. After creation, each hub card has a small <code className="text-stone-700 bg-stone-100 px-1 py-0.5 rounded text-xs">📁 folder name</code> dropdown — tap it to move the hub without going into Settings.
            </p>
            <p>
              <strong>Hub type badge:</strong> When you create a hub from a template, a badge like <code className="text-stone-700 bg-stone-100 px-1 py-0.5 rounded text-xs">🐾 Pet Profile</code> appears on the dashboard card. For hubs started from Blank, you can add this label later via the hub's <strong>Settings tab → Hub type</strong>. Changing the type only updates the badge — it does not add or remove content blocks.
            </p>
          </div>
        </section>

        {/* Block types */}
        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-6">Block types</h2>
          <div className="space-y-5">
            {BLOCK_TYPES.map(b => (
              <div key={b.name} className="border-l-2 border-stone-100 pl-4">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-semibold text-stone-800">{b.name}</span>
                </div>
                <p className="text-sm text-stone-600 leading-[1.65] mb-1">{b.description}</p>
                <p className="text-xs text-stone-400">
                  <span className="font-medium">Examples:</span> {b.examples}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Accent text */}
        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-3">Styled quote / passage text</h2>
          <p className="text-sm text-stone-600 leading-[1.65] mb-4 max-w-prose">
            Any <strong>Text</strong> block whose label contains one of the following words automatically renders in italic with a thin accent-color left border — useful for quotes, poetry, featured passages, spoken text, or any content that should feel set apart from body copy:
          </p>
          <div className="flex flex-wrap gap-2">
            {CEREMONIAL_LABELS.map(w => (
              <span key={w} className="text-xs text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">{w}</span>
            ))}
          </div>
          <p className="text-xs text-stone-400 mt-3">
            This is automatic — no configuration needed. Rename any block label to include one of these words to activate the styling.
          </p>
        </section>

        {/* Collapse behavior */}
        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-3">Default collapse state</h2>
          <p className="text-sm text-stone-600 leading-[1.65] mb-4 max-w-prose">
            On the public hub view, every block is collapsible — visitors tap the section header to expand or collapse it.
            The initial open or closed state when the page first loads is controlled automatically by keywords in the block's label.
            You can change how any block opens by default simply by including or avoiding these words in its label.
          </p>
          <div className="border-t border-stone-100 divide-y divide-stone-100">
            {COLLAPSE_BEHAVIOR.map(row => (
              <div key={row.rule} className="py-3 flex gap-4">
                <span className="text-xs font-semibold text-stone-700 w-36 flex-shrink-0 pt-0.5">{row.rule}</span>
                <span className="text-xs text-stone-500">Label contains: <em>{row.examples}</em></span>
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-400 mt-3">
            Matching is case-insensitive and partial — "Correspondences" matches "correspond," "Setup Steps" matches "setup," and so on.
            If a label doesn't match any keyword, the block starts open.
            To make a block start collapsed, rename its label to include one of the closed keywords (e.g. rename "Extra Notes" to "Setup Notes" — the word "setup" triggers closed).
          </p>
        </section>

        {/* Templates */}
        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-6">Templates</h2>
          <div className="space-y-10">
            {TEMPLATES.map(t => (
              <div key={t.name}>
                <div className="flex items-baseline gap-2.5 mb-2">
                  <span className="text-xl leading-none">{t.emoji}</span>
                  <h3 className="text-base font-semibold text-stone-800">{t.name}</h3>
                  <span className="text-xs text-stone-400">{t.themeColor}</span>
                </div>
                <p className="text-sm text-stone-600 leading-[1.65] mb-4 max-w-prose">{t.description}</p>
                {t.blocks.length > 0 && (
                  <div className="border-t border-stone-100 divide-y divide-stone-100">
                    {t.blocks.map((b, i) => (
                      <div key={b.label} className="py-2.5 flex gap-4">
                        <span className="text-[0.6875rem] text-stone-300 w-5 flex-shrink-0 pt-0.5 text-right">{i + 1}</span>
                        <div className="flex-1">
                          <span className="text-xs font-semibold text-stone-700">{b.label}</span>
                          <span className="text-xs text-stone-400 ml-2">({b.type})</span>
                          {b.note && <p className="text-xs text-stone-400 mt-0.5">{b.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Tips */}
        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-4">Tips</h2>
          <ul className="space-y-3 text-sm text-stone-600 leading-[1.65] max-w-prose">
            <li><strong>Slugs are permanent.</strong> The URL slug is the identifier encoded in the QR code. Changing it breaks printed codes. Choose it carefully at creation time.</li>
            <li><strong>Block order matters.</strong> Blocks appear in sort order. Use ▲▼ arrows in the editor to reorder. High-priority content should come first since visitors read top-to-bottom.</li>
            <li><strong>Checklists are per-device.</strong> The checked state is stored in each visitor's browser localStorage — not the database. Every new device starts fresh.</li>
            <li><strong>Label your voice notes.</strong> Audio blocks with a date and label are much more meaningful when revisited weeks or months later.</li>
            <li><strong>Image blocks support upload or URL.</strong> You can upload a photo directly from the image block editor, or paste a public URL. Uploaded images are stored in Supabase Storage.</li>
            <li><strong>Redirect mode is instant.</strong> A hub in redirect mode sends visitors directly to the destination URL with no loading screen shown.</li>
            <li><strong>Hub privacy options:</strong> Public (anyone can find and view), Unlisted (only people with the link can view), Private (only you can view when signed in).</li>
            <li><strong>Block content indicators.</strong> In the block editor, a small green dot means the block has content; a hollow gray ring means it's empty. Use this to scan quickly for blocks that still need filling in after applying a template.</li>
            <li><strong>Hub type can be set anytime.</strong> Even hubs created from Blank can get a template badge — open Settings and choose a hub type. This just labels the card and has no effect on the content blocks.</li>
          </ul>
        </section>

      </main>

      <footer className="text-center py-10 text-[0.6875rem] text-stone-400">
        © 2026 QRMagNotes | Developed by{' '}
        <a href="https://websketching.com" target="_blank" rel="noopener noreferrer"
          className="hover:text-stone-600 transition-colors underline underline-offset-2">
          Websketching
        </a>
      </footer>
    </div>
  )
}
