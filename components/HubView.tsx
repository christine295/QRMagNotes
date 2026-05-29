'use client'

import { useState, useEffect } from 'react'
import SiteFooter from '@/components/SiteFooter'

// ── Icons ─────────────────────────────────────────────────────────────────────

type IconProps = { className?: string }

const NoteIcon = ({ className = 'w-3.5 h-3.5' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    <path d="M9 12h6M9 16h4" />
  </svg>
)

const ChecklistIcon = ({ className = 'w-3.5 h-3.5' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    <path d="M9 12l2 2 4-4" />
  </svg>
)

const MicIcon = ({ className = 'w-3.5 h-3.5' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 013 3v7a3 3 0 01-6 0V5a3 3 0 013-3z" />
    <path d="M19 10v1a7 7 0 01-14 0v-1M12 19v3M9 22h6" />
  </svg>
)

const LinkIcon = ({ className = 'w-3.5 h-3.5' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </svg>
)

const PhoneIcon = ({ className = 'w-3.5 h-3.5' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
)

const FileIcon = ({ className = 'w-3.5 h-3.5' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
    <path d="M13 2v7h7" />
  </svg>
)

const ClockIcon = ({ className = 'w-3.5 h-3.5' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
)

function BlockIcon({ type, className = 'w-3.5 h-3.5' }: { type: string; className?: string }) {
  const p = { className }
  switch (type) {
    case 'text':      return <NoteIcon      {...p} />
    case 'checklist': return <ChecklistIcon {...p} />
    case 'audio':     return <MicIcon       {...p} />
    case 'link':      return <LinkIcon      {...p} />
    case 'phone':     return <PhoneIcon     {...p} />
    case 'file':      return <FileIcon      {...p} />
    case 'timeline':  return <ClockIcon     {...p} />
    default:          return null
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(s: string) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

function isCeremonial(label: string) {
  return /invocation|words to speak|quote|passage|poem|prayer|sacred/i.test(label)
}

function defaultOpen(type: string, label: string): boolean {
  const l = label.toLowerCase()
  if (l.includes('overview') || l.includes('step') || l.includes('note') || l.includes('invocation') || l.includes('words')) return true
  if (l.includes('setup') || l.includes('correspond') || l.includes('photo') || l.includes('memor') || l.includes('follow') || l.includes('playlist') || l.includes('voice')) return false
  return true
}

// ── Checklist — small circle bullets, editorial feel ─────────────────────────

function ChecklistItems({ blockId, items, color }: {
  blockId: string
  items: { id: string; text: string }[]
  color: string
}) {
  const [checked, setChecked] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const s = localStorage.getItem(`checklist-${blockId}`)
      return s ? new Set(JSON.parse(s)) : new Set()
    } catch { return new Set() }
  })

  function toggle(id: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      try { localStorage.setItem(`checklist-${blockId}`, JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const allDone = items.length > 0 && items.every(i => checked.has(i.id))

  return (
    <div>
      <ul className="space-y-3.5">
        {items.map(item => (
          <li key={item.id}>
            <button type="button" onClick={() => toggle(item.id)}
              className="flex items-start gap-3.5 w-full text-left"
            >
              <span
                className="mt-[0.35rem] w-2 h-2 rounded-full flex-shrink-0 border transition-all duration-200"
                style={{
                  borderColor: checked.has(item.id) ? color : '#c7c4bf',
                  backgroundColor: checked.has(item.id) ? color : 'transparent',
                }}
              />
              <span className={`text-[0.9375rem] leading-[1.6] tracking-[-0.005em] transition-colors duration-200 ${
                checked.has(item.id) ? 'line-through text-stone-300' : 'text-stone-600'
              }`}>
                {item.text}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {allDone && (
        <button type="button"
          onClick={() => { setChecked(new Set()); try { localStorage.removeItem(`checklist-${blockId}`) } catch {} }}
          className="mt-5 text-[0.6875rem] tracking-[0.06em] uppercase text-stone-300 hover:text-stone-500 transition-colors"
        >
          Begin again
        </button>
      )}
    </div>
  )
}

// ── Collapsible section — no card, hairline-separated ─────────────────────────

function Section({ type, label, open, onToggle, children }: {
  type: string
  label: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <button type="button" onClick={onToggle}
        className="w-full flex items-center gap-3 py-3 text-left"
      >
        <span className={`flex-shrink-0 transition-colors duration-200 ${open ? 'text-stone-500' : 'text-stone-300'}`}>
          <BlockIcon type={type} />
        </span>
        <span className={`flex-1 text-sm tracking-[-0.005em] transition-colors duration-200 ${
          open ? 'font-semibold text-stone-800' : 'font-medium text-stone-500'
        }`}>
          {label}
        </span>
        <svg
          className={`w-3 h-3 flex-shrink-0 text-stone-300 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
          strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-[4000px]' : 'max-h-0'}`}>
        <div className="pl-6 pb-5 pt-0.5">
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function HubView({ hub, blocks, color, isOwner, username, collectionHubs, currentUserId, isSaved: initialIsSaved, heartCount: initialHeartCount, userHearted: initialUserHearted, autoSave: initialAutoSave }: {
  hub: any
  blocks: any[]
  color: string
  isOwner: boolean
  username: string
  collectionHubs?: Record<string, any[]>
  currentUserId?: string | null
  isSaved?: boolean
  heartCount?: number
  userHearted?: boolean
  autoSave?: boolean
}) {
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const s: Record<string, boolean> = {}
    blocks.forEach(b => { s[b.id] = defaultOpen(b.type, b.data?.label ?? '') })
    return s
  })
  const [saved, setSaved] = useState(initialIsSaved ?? false)
  const [hearted, setHearted] = useState(initialUserHearted ?? false)
  const [hearts, setHearts] = useState(initialHeartCount ?? 0)
  const [savePending, setSavePending] = useState(false)
  const [heartPending, setHeartPending] = useState(false)

  // Auto-save when returning from login with ?save=1
  useEffect(() => {
    if (!initialAutoSave || !currentUserId || (initialIsSaved ?? false)) return
    ;(async () => {
      setSavePending(true)
      const res = await fetch(`/api/hub/${hub.id}/save`, { method: 'POST' })
      if (res.ok) {
        setSaved(true)
        window.history.replaceState({}, '', `/h/${username}/${hub.slug}`)
      }
      setSavePending(false)
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) => setOpen(p => ({ ...p, [id]: !p[id] }))

  async function handleSaveClick() {
    if (!currentUserId) {
      window.location.href = `/login?next=${encodeURIComponent(`/h/${username}/${hub.slug}?save=1`)}`
      return
    }
    setSavePending(true)
    const res = await fetch(`/api/hub/${hub.id}/save`, { method: saved ? 'DELETE' : 'POST' })
    if (res.ok) setSaved(v => !v)
    setSavePending(false)
  }

  async function handleHeartClick() {
    if (!currentUserId) {
      window.location.href = `/login?next=${encodeURIComponent(`/h/${username}/${hub.slug}`)}`
      return
    }
    setHeartPending(true)
    const res = await fetch(`/api/hub/${hub.id}/heart`, { method: hearted ? 'DELETE' : 'POST' })
    if (res.ok) {
      setHearted(v => !v)
      setHearts(n => hearted ? n - 1 : n + 1)
    }
    setHeartPending(false)
  }

  const hasImageHero = !!hub.image_url

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF9F7' }}>

      {/* Owner bar */}
      {isOwner && (
        <div className="bg-white/90 backdrop-blur-sm border-b border-stone-200 px-4 py-2.5 flex items-center justify-between sticky top-0 z-20">
          <span className="text-[0.6875rem] text-stone-400 tracking-[0.05em] uppercase">Your Hub</span>
          <a href={`/dashboard/hub/${hub.id}/edit`}
            className="text-xs font-medium text-stone-600 border border-stone-200 rounded-lg px-3 py-1.5 hover:bg-stone-50 transition-colors"
          >
            Edit
          </a>
        </div>
      )}

      {/* Visitor bar — for non-owners */}
      {!isOwner && (
        <div className="bg-white/90 backdrop-blur-sm border-b border-stone-200 px-4 py-2.5 flex items-center justify-between sticky top-0 z-20">
          {/* Left: dashboard link (logged-in) or empty spacer (logged-out) */}
          {currentUserId ? (
            <a
              href="/dashboard"
              className="text-[0.6875rem] text-stone-400 tracking-[0.05em] uppercase hover:text-stone-600 transition-colors"
            >
              « Dashboard
            </a>
          ) : (
            <span />
          )}

          {/* Right: heart + save */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleHeartClick}
              disabled={heartPending}
              aria-label={hearted ? 'Remove heart' : 'Heart this hub'}
              className={`flex items-center gap-1.5 transition-colors ${
                hearted ? 'text-rose-500' : 'text-stone-400 hover:text-rose-400'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24"
                fill={hearted ? 'currentColor' : 'none'}
                stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
              {hearts > 0 && <span className="text-xs font-medium">{hearts}</span>}
            </button>
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={savePending}
              className={`text-xs font-medium border rounded-lg px-3 py-1.5 transition-colors ${
                saved
                  ? 'text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                  : 'text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
            >
              {saved ? '✓ Saved' : 'Save Hub'}
            </button>
          </div>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      {hasImageHero ? (
        <div className="relative w-full overflow-hidden" style={{ height: 'clamp(260px, 46vw, 460px)' }}>
          <img src={hub.image_url} alt={hub.title}
            className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-7 md:px-8 md:pb-10">
            <h1
              className="text-[1.875rem] md:text-[2.375rem] font-bold text-white leading-tight tracking-[-0.02em]"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
            >
              {hub.title}
            </h1>
          </div>
        </div>
      ) : (
        <div className="relative px-6 py-14 md:py-20 text-center" style={{ backgroundColor: color }}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/20 pointer-events-none" />
          <div className="relative">
            <h1 className="text-[1.875rem] md:text-[2.375rem] font-bold text-white leading-tight tracking-[-0.02em]">
              {hub.title}
            </h1>
            {hub.description && (
              <p className="mt-3 text-white/70 text-[0.9375rem] leading-[1.6] max-w-[34ch] mx-auto">
                {hub.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <main className="max-w-xl mx-auto px-5 pb-14">

        {/* Description — only shown beneath image hero */}
        {hasImageHero && hub.description && (
          <div className="pt-7 pb-5">
            <p className="text-[0.9375rem] text-stone-600 leading-[1.65] tracking-[-0.005em] max-w-[36ch]">
              {hub.description}
            </p>
          </div>
        )}

        {/* Blocks list — hairline-separated, no cards */}
        {blocks.length > 0 ? (
          <div className={`border-t border-stone-100 divide-y divide-stone-100 ${!(hasImageHero && hub.description) ? 'mt-7' : ''}`}>
            {blocks.map(block => {
              const d = block.data as any
              const isOpen = open[block.id] ?? true

              // ── Link / phone / file — quiet text rows ──────────────────────
              if (block.type === 'link' || block.type === 'phone' || block.type === 'file') {
                if (!d.url) return null
                const href = block.type === 'phone' ? `tel:${d.url}` : d.url
                return (
                  <a
                    key={block.id}
                    href={href}
                    {...(block.type !== 'phone' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="flex items-center gap-3 py-3 group"
                  >
                    <span className="flex-shrink-0 opacity-50" style={{ color }}>
                      <BlockIcon type={block.type} />
                    </span>
                    <span className="flex-1 text-[0.875rem] text-stone-600 tracking-[-0.005em] leading-snug">
                      {d.label || d.url}
                    </span>
                    <svg className="w-3 h-3 text-stone-300 flex-shrink-0"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17L17 7M7 7h10v10" />
                    </svg>
                  </a>
                )
              }

              // ── Image — inline, edge-to-edge within column ─────────────────
              if (block.type === 'image') {
                if (!d.url) return null
                return (
                  <div key={block.id} className="py-5">
                    <div className="rounded-xl overflow-hidden">
                      <img src={d.url} alt={d.caption || ''} className="w-full object-cover" />
                    </div>
                    {d.caption && (
                      <p className="text-xs text-stone-400 mt-2.5 leading-relaxed">{d.caption}</p>
                    )}
                  </div>
                )
              }

              // ── Collection menu — Linktree-style hub button grid ───────────
              if (block.type === 'collection_menu') {
                const menuHubs = collectionHubs?.[block.id] ?? []
                if (menuHubs.length === 0) {
                  return isOwner ? (
                    <div key={block.id} className="py-4 text-sm text-stone-400 italic">
                      Hub Collector — no visible Hubs in this Collection yet.
                    </div>
                  ) : null
                }
                return (
                  <div key={block.id} className="py-5 space-y-3">
                    {menuHubs.map((h: any) => (
                      <a
                        key={h.id}
                        href={`/h/${h.owner_username ?? username}/${h.slug}`}
                        className="block rounded-xl px-5 py-4 transition-all hover:opacity-90 active:scale-[0.99]"
                        style={{
                          backgroundColor: `${h.theme_color ?? color}14`,
                          borderLeft: `4px solid ${h.theme_color ?? color}`,
                        }}
                      >
                        <div className="font-semibold text-stone-800 text-[0.9375rem] tracking-[-0.005em]">
                          {h.title}
                        </div>
                        {h.description && (
                          <div className="text-sm text-stone-500 mt-0.5 leading-snug">{h.description}</div>
                        )}
                        {isOwner && h.privacy_mode === 'private' && (
                          <div className="text-xs text-amber-500 mt-1">Private — only visible to you</div>
                        )}
                      </a>
                    ))}
                  </div>
                )
              }

              // ── Collapsible blocks ─────────────────────────────────────────
              const label = d.label || block.type

              return (
                <Section key={block.id} type={block.type} label={label} open={isOpen} onToggle={() => toggle(block.id)}>

                  {/* Text / Note */}
                  {block.type === 'text' && (
                    <>
                      {d.date && <p className="text-xs text-stone-400 mb-3">{formatDate(d.date)}</p>}
                      {isCeremonial(d.label ?? '') ? (
                        <div className="border-l-2 pl-4" style={{ borderColor: `${color}35` }}>
                          <p className="text-[0.9375rem] text-stone-600 whitespace-pre-line leading-[1.85] italic">
                            {d.text || <em className="text-stone-300 not-italic">Nothing written yet.</em>}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[0.9375rem] text-stone-700 whitespace-pre-line leading-[1.65] tracking-[-0.005em]">
                          {d.text || <em className="text-stone-300 not-italic">Nothing written yet.</em>}
                        </p>
                      )}
                    </>
                  )}

                  {/* Checklist */}
                  {block.type === 'checklist' && (
                    <ChecklistItems blockId={block.id} items={d.items ?? []} color={color} />
                  )}

                  {/* Audio */}
                  {block.type === 'audio' && (
                    <>
                      {d.date && <p className="text-xs text-stone-400 mb-3">{formatDate(d.date)}</p>}
                      {d.url
                        ? <audio src={d.url} controls className="w-full rounded-lg" />
                        : <p className="text-sm text-stone-300 italic">No recording yet.</p>
                      }
                    </>
                  )}

                  {/* Timeline */}
                  {block.type === 'timeline' && (
                    <div className="relative pl-4 border-l" style={{ borderColor: `${color}25` }}>
                      {(d.events ?? []).map((ev: any, i: number) => (
                        <div key={ev.id ?? i} className="mb-5 last:mb-0 relative">
                          <span
                            className="absolute -left-[9px] top-[5px] w-[7px] h-[7px] rounded-full"
                            style={{ backgroundColor: color, boxShadow: '0 0 0 2px #FAF9F7' }}
                          />
                          {ev.date && <p className="text-xs text-stone-400 mb-1">{ev.date}</p>}
                          <p className="text-[0.9375rem] text-stone-600 leading-[1.65]">{ev.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                </Section>
              )
            })}
          </div>
        ) : (
          <p className="text-center text-stone-300 text-sm mt-16">No content yet.</p>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
