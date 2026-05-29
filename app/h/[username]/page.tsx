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

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const [{ data: hubs }, { data: { user } }] = await Promise.all([
    supabase
      .from('hubs')
      .select('id, title, description, slug, theme_color, template_id, updated_at')
      .eq('user_id', profile.id)
      .eq('privacy_mode', 'public')
      .eq('mode', 'landing')
      .order('updated_at', { ascending: false }),
    supabase.auth.getUser(),
  ])

  // Fetch heart counts for these hubs
  const hubIds = (hubs ?? []).map(h => h.id)
  const { data: heartRows } = hubIds.length > 0
    ? await supabase.from('hub_hearts').select('hub_id').in('hub_id', hubIds)
    : { data: [] }
  const heartCounts: Record<string, number> = {}
  ;(heartRows ?? []).forEach((h: any) => { heartCounts[h.hub_id] = (heartCounts[h.hub_id] ?? 0) + 1 })

  const isOwner = user?.id === profile.id
  const publicHubs: any[] = hubs ?? []

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <header className="bg-white border-b border-stone-200 px-4 py-3.5 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/explore" className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
            « Explore
          </Link>
          {isOwner && (
            <Link href="/dashboard" className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
              Dashboard »
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        {/* Profile header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">@{profile.username}</h1>
          <p className="text-sm text-stone-400 mt-1">
            {publicHubs.length === 0
              ? 'No public Hubs yet'
              : `${publicHubs.length} public ${publicHubs.length === 1 ? 'Hub' : 'Hubs'}`}
          </p>
        </div>

        {publicHubs.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="text-4xl mb-4">✦</div>
            <p className="text-stone-400 text-sm">No public Hubs to show yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {publicHubs.map(hub => {
              const template = hub.template_id ? TEMPLATE_LABELS[hub.template_id] : null
              const hearts = heartCounts[hub.id] ?? 0
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
                    <div className="flex items-center gap-2 mt-2.5 text-[10px] text-stone-300">
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
