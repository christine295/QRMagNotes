import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SiteFooter from '@/components/SiteFooter'

const TEMPLATE_LABELS: Record<string, { emoji: string; label: string }> = {
  artwork:      { emoji: '🎨', label: 'Artwork Archive' },
  book:         { emoji: '📖', label: 'Book Notes' },
  diary:        { emoji: '📔', label: 'Diary / Life Log' },
  garden:       { emoji: '🌱', label: 'Garden Planner' },
  goal:         { emoji: '🎯', label: 'Goal Tracker' },
  grocery:      { emoji: '🛒', label: 'Grocery List' },
  hub_collector:{ emoji: '🔗', label: 'Hub Menu' },
  journal:      { emoji: '📓', label: 'Daily Reflection' },
  maintenance:  { emoji: '🔧', label: 'Home Maintenance' },
  packing:      { emoji: '🧳', label: 'Packing List' },
  pet:          { emoji: '🐾', label: 'Pet Profile' },
  plant:        { emoji: '🪴', label: 'Plant Profile' },
  recipe:       { emoji: '🍳', label: 'Recipe' },
  ritual:       { emoji: '🕯️', label: 'Ritual' },
  shadow_work:  { emoji: '🌑', label: 'Shadow Work' },
  travel:       { emoji: '✈️', label: 'Travel Journal' },
  vehicle:      { emoji: '🚗', label: 'Vehicle' },
  box:          { emoji: '📦', label: "What's in the Box?" },
  workout:      { emoji: '💪', label: 'Workout' },
}

type BadgeData = {
  hubCount: number
  savedCount: number
  totalHearts: number
  totalSaves: number
  totalViews: number
  totalShares: number
  hasAudio: boolean
  blockTypeCount: number
  isIntroduced: boolean
}

// Manually awarded via SQL: UPDATE profiles SET badges = array_append(badges, 'founder') WHERE username = 'christine'
const SPECIAL_BADGE_DISPLAY: Record<string, { name: string; emoji: string; className: string }> = {
  founder: { name: 'Founder',     emoji: '👑', className: 'bg-purple-600 text-white shadow-sm' },
  beta:    { name: 'Beta Tester', emoji: '🧪', className: 'bg-teal-100 text-teal-700 border border-teal-200' },
}

const ALL_BADGES = [
  { key: '1st-hub',       name: '1st Hub',       emoji: '🏷️', desc: 'Created your first hub',                    check: (d: BadgeData) => d.hubCount >= 1 },
  { key: 'archivist',     name: 'Archivist',      emoji: '📚', desc: '5 hubs created',                            check: (d: BadgeData) => d.hubCount >= 5 },
  { key: 'chronicler',    name: 'Chronicler',     emoji: '📜', desc: '10 hubs created',                           check: (d: BadgeData) => d.hubCount >= 10 },
  { key: 'voice',         name: 'Voice',          emoji: '🎙️', desc: 'Added audio to a hub',                     check: (d: BadgeData) => d.hasAudio },
  { key: 'storyteller',   name: 'Storyteller',    emoji: '✍️', desc: 'Used 5+ block types',                      check: (d: BadgeData) => d.blockTypeCount >= 5 },
  { key: 'curator',       name: 'Curator',        emoji: '🗂️', desc: 'Saved 5+ hubs from others',               check: (d: BadgeData) => d.savedCount >= 5 },
  { key: 'hearted',       name: 'Hearted',        emoji: '❤️', desc: '10 hearts received',                       check: (d: BadgeData) => d.totalHearts >= 10 },
  { key: 'beloved',       name: 'Beloved',        emoji: '💝', desc: '50 hearts received',                       check: (d: BadgeData) => d.totalHearts >= 50 },
  { key: 'treasured',     name: 'Treasured',      emoji: '💎', desc: '10 saves received',                        check: (d: BadgeData) => d.totalSaves >= 10 },
  { key: 'in-the-wild',   name: 'In the Wild',    emoji: '🌍', desc: '500 views',                                check: (d: BadgeData) => d.totalViews >= 500 },
  { key: 'circulating',   name: 'Circulating',    emoji: '🔁', desc: '5,000 views',                              check: (d: BadgeData) => d.totalViews >= 5000 },
  { key: 'word-of-mouth', name: 'Word of Mouth',  emoji: '💬', desc: 'Shared a hub',                             check: (d: BadgeData) => d.totalShares >= 1 },
  { key: 'introduced',    name: 'Introduced',     emoji: '👋', desc: 'Bio, avatar, and social link added',       check: (d: BadgeData) => d.isIntroduced },
  { key: 'hub-collector', name: 'HubCollector',   emoji: '⭐', desc: '10+ hubs · 10+ saved · 50+ hearts · 50+ saves', check: (d: BadgeData) =>
    d.hubCount >= 10 && d.savedCount >= 10 && d.totalHearts >= 50 && d.totalSaves >= 50 },
]

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, avatar_url, social_links, saved_count, badges')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const [{ data: hubs }, { data: { user } }] = await Promise.all([
    supabase
      .from('hubs')
      .select('id, title, description, slug, theme_color, template_id, updated_at, heart_count, save_count, view_count, share_count')
      .eq('user_id', profile.id)
      .eq('privacy_mode', 'public')
      .eq('mode', 'landing')
      .order('updated_at', { ascending: false }),
    supabase.auth.getUser(),
  ])

  const isOwner = user?.id === profile.id
  const publicHubs: any[] = hubs ?? []

  // Fetch heart counts per hub (fallback if heart_count column not yet migrated)
  const hubIds = publicHubs.map(h => h.id)
  const { data: heartRows } = hubIds.length > 0
    ? await supabase.from('hub_hearts').select('hub_id').in('hub_id', hubIds)
    : { data: [] }
  const heartCountMap: Record<string, number> = {}
  ;(heartRows ?? []).forEach((h: any) => { heartCountMap[h.hub_id] = (heartCountMap[h.hub_id] ?? 0) + 1 })

  // Badge data — aggregate from public hubs + profile
  const totalHearts = publicHubs.reduce((s, h) => s + (h.heart_count ?? heartCountMap[h.id] ?? 0), 0)
  const totalSaves  = publicHubs.reduce((s, h) => s + (h.save_count ?? 0), 0)
  const totalViews  = publicHubs.reduce((s, h) => s + (h.view_count ?? 0), 0)
  const totalShares = publicHubs.reduce((s, h) => s + (h.share_count ?? 0), 0)
  const savedCount  = (profile as any).saved_count ?? 0

  // Block type variety — query content_blocks (publicly readable)
  let hasAudio = false
  const blockTypeSet = new Set<string>()
  if (hubIds.length > 0) {
    const { data: blocks } = await supabase
      .from('content_blocks').select('type').in('hub_id', hubIds)
    ;(blocks ?? []).forEach((b: any) => {
      blockTypeSet.add(b.type)
      if (b.type === 'audio') hasAudio = true
    })
  }

  const p = profile as any
  const isIntroduced = !!(p.display_name && p.avatar_url && (p.social_links?.length ?? 0) > 0)

  const badgeData: BadgeData = {
    hubCount: publicHubs.length,
    savedCount,
    totalHearts,
    totalSaves,
    totalViews,
    totalShares,
    hasAudio,
    blockTypeCount: blockTypeSet.size,
    isIntroduced,
  }
  const earnedBadges = ALL_BADGES.filter(b => b.check(badgeData))
  const specialBadges = ((p.badges ?? []) as string[])
    .filter(k => SPECIAL_BADGE_DISPLAY[k])

  const displayName = p.display_name || `@${profile.username}`
  const socialLinks: { label: string; url: string }[] = p.social_links ?? []

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <header className="bg-white border-b border-stone-200 px-4 py-3.5 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/explore" className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
            « Explore
          </Link>
          {isOwner && (
            <div className="flex items-center gap-3">
              <Link
                href="/settings/profile"
                className="text-sm font-medium text-stone-600 border border-stone-200 rounded-lg px-3 py-1.5 hover:bg-stone-50 transition-colors"
              >
                Edit Profile
              </Link>
              <Link href="/dashboard" className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
                Dashboard »
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">

        {/* Profile header */}
        <div className="flex items-start gap-4 mb-6">
          {/* Avatar */}
          <div className="shrink-0">
            {p.avatar_url ? (
              <img
                src={p.avatar_url}
                alt={displayName}
                className="w-16 h-16 rounded-full object-cover object-top bg-stone-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-2xl font-semibold text-teal-600 select-none">
                {(displayName[0] === '@' ? displayName[1] : displayName[0])?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Name, username, bio */}
          <div className="min-w-0 flex-1 pt-1">
            <h1 className="text-lg font-bold text-stone-900 leading-tight">{displayName}</h1>
            {p.display_name && (
              <p className="text-xs text-stone-400 mt-0.5">@{profile.username}</p>
            )}
            {p.bio && (
              <p className="text-sm text-stone-600 mt-1.5 leading-[1.6]">{p.bio}</p>
            )}
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {socialLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-500 hover:text-blue-700 flex items-center gap-0.5 transition-colors"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                    </svg>
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Badges */}
        {(specialBadges.length > 0 || earnedBadges.length > 0) && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-1.5">
              {/* Special badges (founder, beta) — shown first */}
              {specialBadges.map(key => {
                const s = SPECIAL_BADGE_DISPLAY[key]
                return (
                  <span
                    key={key}
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${s.className}`}
                  >
                    {s.emoji} {s.name}
                  </span>
                )
              })}
              {/* Earned badges */}
              {earnedBadges.map(badge => (
                badge.key === 'hub-collector' ? (
                  <span
                    key={badge.key}
                    title={badge.desc}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-400 text-white shadow-sm"
                  >
                    {badge.emoji} {badge.name}
                  </span>
                ) : (
                  <span
                    key={badge.key}
                    title={badge.desc}
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200"
                  >
                    {badge.emoji} {badge.name}
                  </span>
                )
              ))}
            </div>
          </div>
        )}

        {/* Hub count heading */}
        <div className="border-t border-stone-100 pt-6 mb-5">
          <p className="text-xs text-stone-400 uppercase tracking-[0.08em] font-medium">
            {publicHubs.length === 0
              ? 'No public Hubs yet'
              : `${publicHubs.length} public ${publicHubs.length === 1 ? 'Hub' : 'Hubs'}`}
          </p>
        </div>

        {publicHubs.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="text-4xl mb-4">✦</div>
            <p className="text-stone-400 text-sm">No public Hubs to show yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {publicHubs.map(hub => {
              const template = hub.template_id ? TEMPLATE_LABELS[hub.template_id] : null
              const hearts = hub.heart_count ?? heartCountMap[hub.id] ?? 0
              const saves = hub.save_count ?? 0
              return (
                <a
                  key={hub.id}
                  href={`/h/${username}/${hub.slug}`}
                  className="block bg-white rounded-xl border border-stone-100 px-4 py-4 hover:shadow-md transition-all"
                  style={{ borderLeft: `3px solid ${hub.theme_color ?? '#E5E7EB'}` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="font-semibold text-stone-900 leading-snug text-sm truncate">{hub.title}</h2>
                      {hub.description && (
                        <p className="text-xs text-stone-400 mt-0.5 leading-snug line-clamp-2">{hub.description}</p>
                      )}
                    </div>
                    {template && (
                      <span className="shrink-0 text-[11px] text-stone-400 bg-stone-50 px-1.5 py-px rounded-full whitespace-nowrap">
                        {template.emoji} {template.label}
                      </span>
                    )}
                  </div>
                  {(hearts > 0 || saves > 0) && (
                    <div className="flex items-center gap-2 mt-2.5 text-[10px]">
                      {hearts > 0 && (
                        <span className="flex items-center gap-0.5 text-rose-300">
                          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                          </svg>
                          {hearts}
                        </span>
                      )}
                      {saves > 0 && (
                        <span className="flex items-center gap-0.5 text-blue-300">
                          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                          </svg>
                          {saves}
                        </span>
                      )}
                    </div>
                  )}
                </a>
              )
            })}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
