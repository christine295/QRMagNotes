import Link from 'next/link'

const BLOCK_TYPES = [
  {
    name: 'Text / Note',
    icon: '📝',
    description: 'Rich written content — overviews, instructions, reflections, descriptions. Supports multi-line whitespace-preserved text. Accepts an optional label and date.',
    ritualUse: 'Ritual Overview, Correspondences, Invocation, Ritual Notes',
  },
  {
    name: 'Checklist',
    icon: '☑',
    description: 'Step-by-step list with tap-to-complete items. Checked state is stored locally per device — visitors can track their own progress. "Begin again" resets all items.',
    ritualUse: 'Ritual Setup, Ritual Steps, Follow-Up tasks',
  },
  {
    name: 'Audio / Voice Note',
    icon: '🎙',
    description: 'Embedded audio player for any hosted audio URL. Supports an optional label and recording date. Ideal for voice reflections or ambient recordings captured during ritual.',
    ritualUse: 'Voice Reflections, In the Moment recordings',
  },
  {
    name: 'Link',
    icon: '🔗',
    description: 'A tappable external URL row — opens in a new tab. The label is shown instead of the raw URL. Use for Spotify playlists, reference websites, or any web resource.',
    ritualUse: 'Ritual Playlist, reference materials',
  },
  {
    name: 'Phone',
    icon: '📞',
    description: 'A tap-to-call phone number. Tapping opens the device dialer. Good for emergency contacts, schedulers, or service numbers attached to a physical item.',
    ritualUse: 'Contact references',
  },
  {
    name: 'File',
    icon: '📄',
    description: 'A downloadable file — any publicly hosted URL (PDF, image, etc.). Shown as a tappable row with a label.',
    ritualUse: 'Printable guides, ceremony sheets, permission forms',
  },
  {
    name: 'Image',
    icon: '🖼',
    description: 'An inline photo or image from any public URL. Displayed edge-to-edge within the content column with an optional caption beneath.',
    ritualUse: 'Altar photos, sacred imagery, ritual documentation',
  },
  {
    name: 'Timeline',
    icon: '📅',
    description: 'A vertical sequence of dated events with accent-color dot markers. Each event has an optional date and a text description. Good for history, milestones, or ritual lineage.',
    ritualUse: 'Ritual history, seasonal progression, tradition lineage',
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
    name: 'Artwork Memory Hub',
    emoji: '🎨',
    description: 'Pre-fills a hub title, description, and violet theme. No pre-built content blocks — add whichever block types suit the artwork. Designed to attach to the back of a painting or piece of art.',
    blocks: [],
    themeColor: '#8B5CF6',
    note: 'Suggested blocks: Link (Spotify Playlist, Artist Notes), Text (Creative Process, Inspiration), Image (Process Photos), Audio (Artist Reflection)',
  },
  {
    name: 'Ritual Template',
    emoji: '🕯️',
    description: 'A complete ritual documentation hub with 11 pre-built blocks in ceremonial order. Violet theme. Drop into any ritual practice — adapt labels and content as needed.',
    themeColor: '#8B5CF6',
    blocks: [
      { label: 'Ritual Overview', type: 'Text', note: 'Name, date/season/moon phase, intention, location, participants' },
      { label: 'Ritual Setup', type: 'Checklist', note: '8 setup steps — cleanse space, prepare altar, gather tools, ground and center' },
      { label: 'Correspondences', type: 'Text', note: 'Colors, herbs, crystals, elements, deities, symbols, offerings, tarot cards' },
      { label: 'Ritual Steps', type: 'Checklist', note: '11 steps from opening through closing and final grounding' },
      { label: 'Invocation / Words to Speak', type: 'Text', note: 'Renders in italic with accent border — ceremonial text styling' },
      { label: 'Quote / Passage', type: 'Text', note: 'Renders in italic with accent border — for sacred text, poetry, or seasonal passages' },
      { label: 'Ritual Playlist', type: 'Link', note: 'Spotify or any music URL' },
      { label: 'Voice Reflections', type: 'Audio', note: 'Voice note recorded during or after ritual' },
      { label: 'Ritual Notes', type: 'Text', note: 'Guided reflection prompts — energy, shifts, signs, emotions, lessons' },
      { label: 'Photos', type: 'Image', note: 'Photos from this ritual' },
      { label: 'Follow-Up', type: 'Checklist', note: '7 follow-up actions — journaling, cleanup, recording divination, watching for signs' },
    ],
  },
]

const COLLAPSE_BEHAVIOR = [
  { rule: 'Open by default', examples: 'overview, step, note, invocation, words' },
  { rule: 'Closed by default', examples: 'setup, correspondence, photo, memor, follow, playlist, voice' },
  { rule: 'Open by default (fallback)', examples: 'everything else' },
]

const CEREMONIAL_LABELS = [
  'invocation', 'words to speak', 'quote', 'passage', 'poem', 'prayer', 'sacred',
]

export default function HelpPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF9F7' }}>
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
              You print a QR code pointing to that URL and attach it to something physical — an artwork, a ritual space, a jar, a journal.
              The content behind the QR can be updated at any time without reprinting the code.
            </p>
            <p>
              Hubs can operate in two modes: <strong>landing</strong> (shows a content page with blocks) or <strong>redirect</strong> (instantly sends visitors to another URL).
              Privacy can be set to public, unlisted (link-only), or private (owner-only).
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
                  <span className="font-medium">Used for:</span> {b.ritualUse}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Ceremonial text */}
        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-3">Ceremonial text styling</h2>
          <p className="text-sm text-stone-600 leading-[1.65] mb-4 max-w-prose">
            Any <strong>Text</strong> block whose label contains one of the following words will automatically render in italic with a thin accent-color left border — styled like sacred or poetic text rather than standard body copy:
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
            On the public hub view, sections are collapsible. The default open/closed state is determined by the block's label:
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
            Label matching is case-insensitive and partial — "Invocation" matches "invocation," "Correspondences" matches "correspond," etc.
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
                {t.note && (
                  <p className="text-xs text-stone-400 mb-4 italic">{t.note}</p>
                )}
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
            <li><strong>Image blocks use URLs.</strong> Images are not uploaded to QRMagNotes — they're referenced by URL. Host images elsewhere (Supabase Storage, Dropbox, etc.) and paste the public link.</li>
            <li><strong>Redirect mode is instant.</strong> A hub in redirect mode sends visitors directly to the destination URL with no loading screen shown.</li>
            <li><strong>Hub privacy options:</strong> Public (anyone can find and view), Unlisted (only people with the link can view), Private (only you can view when signed in).</li>
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
