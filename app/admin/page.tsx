import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import FeedbackPanel from '@/components/FeedbackPanel'

const ADMIN_EMAIL = 'christine@websketching.com'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function userStatus(lastSignIn: string | null | undefined, hubCount: number) {
  if (!lastSignIn && hubCount === 0) return { label: 'no activity', style: 'bg-stone-100 text-stone-400' }
  if (!lastSignIn) return { label: 'no sign-in', style: 'bg-stone-100 text-stone-400' }
  const d = new Date(lastSignIn)
  const days = (Date.now() - d.getTime()) / 86400000
  if (days < 7)  return { label: 'active',   style: 'bg-emerald-50 text-emerald-700' }
  if (days < 30) return { label: 'recent',   style: 'bg-blue-50 text-blue-600' }
  return           { label: 'inactive',  style: 'bg-stone-100 text-stone-400' }
}

// ── Welcome Cards reference data ──────────────────────────────────────────────

const CARDS = [
  {
    key: 'journey-welcome-v1', label: 'Welcome', condition: 'hubCount = 0',
    title: "Hi, I'm Christine",
    body: "I built HubCollector to help you turn real-life things, routines, records, and memories into living digital 'Hubs' you can update anytime.",
    cta: 'Create your first Hub · Open Help Guide',
  },
  {
    key: 'journey-first-hub-v1', label: 'Next step', condition: 'hubCount = 1',
    title: "You've created your first Hub",
    body: "The magic really happens when you print the QR code and attach it to something real. Try scanning it with your phone camera first — it's a good moment.",
    cta: 'Print QR card',
  },
  {
    key: 'journey-growing-v1', label: 'Getting organized', condition: 'hubCount ≥ 2',
    title: "You're building something",
    body: "As your Hubs grow, Collections are how this becomes a real system for your life. Group related Hubs together — like Pets, Kitchen, or Home.",
    cta: 'Create a Collection',
  },
  {
    key: 'feature-clone-v1', label: 'Just shipped', condition: 'hubCount ≥ 1',
    title: 'Build it once, reuse it forever',
    body: "Every Hub card now has a 'Clone as new list' button. Create a master packing list, grocery list, or any checklist — then clone it before each trip or shopping run. Pick the categories you need, name it, and start fresh. Your original stays untouched for next time.",
    cta: 'Try the Packing List template »',
  },
  {
    key: 'feature-explore-v1', label: 'Just shipped', condition: 'hubCount ≥ 1',
    title: 'I built you a place to explore',
    body: "The Explore page is live — browse public Hubs from people in the community, filter by type, and see what's popular. You can save anything you find straight to your dashboard.",
    cta: 'Go to Explore »',
  },
  {
    key: 'feature-save-hubs-v1', label: 'Just shipped', condition: 'hubCount ≥ 1',
    title: "You can now save other people's Hubs",
    body: "When you visit any public Hub that isn't yours, tap Save Hub to add it to your dashboard. Organise saved Hubs into Collections — even include them in Hub Collector pages.",
    cta: 'Browse Hubs to save »',
  },
  {
    key: 'feature-profile-v1', label: 'Just shipped', condition: 'hubCount ≥ 1',
    title: 'Your profile page is live',
    body: "Add your name, bio, photo, and social links — your profile at /h/your-username is public and shareable. You'll also earn badges as you use HubCollector.",
    cta: 'Set up your profile »',
  },
  {
    key: 'feature-social-v1', label: 'Just shipped', condition: 'hubCount ≥ 1',
    title: 'Hearts, shares, and views',
    body: "Other people can now heart your Hubs and share them from their phones. You'll see your engagement counts on Hub cards and on your profile — and on the Explore leaderboard.",
    cta: null,
  },
  {
    key: 'journey-established-v1', label: "You've got it", condition: 'hubCount ≥ 4 + all feature cards dismissed',
    title: "You've got the hang of it",
    body: "From here, HubCollector grows with you. I'll keep sharing tips and new features as we go — reach out anytime. I'm still building this alongside you.",
    cta: null,
  },
]

// ── Roadmap ───────────────────────────────────────────────────────────────────

const ROADMAP = [
  { category: 'Infrastructure', items: [
    { done: false, text: 'SMTP setup — email login + signup (currently Google OAuth only)' },
    { done: false, text: 'Fix Google OAuth redirect URI for new signups (currently failing in prod)' },
  ]},
  { category: 'Free / Paid Tier', items: [
    { done: false, text: 'Free tier enforcement — hub and collection limits per plan' },
    { done: false, text: 'hide_footer flag — paid feature to remove footer branding on public hubs' },
    { done: false, text: 'Billing / Stripe integration' },
  ]},
  { category: 'UX Polish', items: [
    { done: false, text: 'Sort order normalization on page load (gaps currently heal on first drag only)' },
    { done: false, text: 'Reset All Checklists button on hub view (reset all blocks at once)' },
    { done: false, text: 'Help page template blocks updated to match expanded packing / grocery counts' },
  ]},
  { category: 'Not Started', items: [
    { done: false, text: 'QR scan / view tracking (hub_scans table + server-side logging)' },
    { done: false, text: 'Collaboration / invite feature' },
    { done: false, text: 'Transactional email notifications (new saves, hearts, etc.)' },
  ]},
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams

  // Auth guard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) redirect('/dashboard')

  const adminClient = createAdminClient()

  // ── Fetch data ───────────────────────────────────────────────────────────────

  const [
    { data: { users: authUsers } },
    { data: profiles },
    { data: hubs },
    { data: collections },
    { data: blocks, count: totalBlocks },
  ] = await Promise.all([
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
    adminClient.from('profiles').select('id, username, email, display_name, created_at'),
    adminClient.from('hubs').select('id, user_id'),
    adminClient.from('collections').select('id, user_id'),
    adminClient.from('content_blocks').select('id', { count: 'exact' }),
  ])

  let feedback: any[] = []
  try {
    const { data: feedbackData } = await adminClient
      .from('feedback')
      .select('id, message, status, created_at, user_id')
      .order('created_at', { ascending: false })

    if (feedbackData && feedbackData.length > 0) {
      const userIds = [...new Set(feedbackData.map((f: any) => f.user_id).filter(Boolean))]
      const { data: fbProfiles } = userIds.length > 0
        ? await adminClient.from('profiles').select('id, username, email').in('id', userIds)
        : { data: [] }
      const profileById = new Map((fbProfiles ?? []).map((p: any) => [p.id, p]))
      feedback = feedbackData.map((f: any) => ({
        ...f,
        profiles: f.user_id ? (profileById.get(f.user_id) ?? null) : null,
      }))
    }
  } catch {
    // feedback table may not exist yet
  }

  // ── Compute stats ────────────────────────────────────────────────────────────

  const now = Date.now()
  const d7  = new Date(now - 7  * 86400000).toISOString()
  const d30 = new Date(now - 30 * 86400000).toISOString()
  const active7d  = authUsers.filter(u => u.last_sign_in_at && u.last_sign_in_at > d7).length
  const active30d = authUsers.filter(u => u.last_sign_in_at && u.last_sign_in_at > d30).length
  const newFeedback = feedback.filter((f: any) => f.status === 'new').length

  const profileMap  = new Map((profiles ?? []).map(p => [p.id, p]))
  const hubCountMap = new Map<string, number>()
  for (const h of hubs ?? []) hubCountMap.set(h.user_id, (hubCountMap.get(h.user_id) ?? 0) + 1)
  const colCountMap = new Map<string, number>()
  for (const c of collections ?? []) colCountMap.set(c.user_id, (colCountMap.get(c.user_id) ?? 0) + 1)

  const userRows = authUsers.map(u => ({
    id: u.id,
    email: u.email ?? '—',
    username: profileMap.get(u.id)?.username ?? '—',
    signedUpAt: profileMap.get(u.id)?.created_at ?? u.created_at,
    lastSignIn: u.last_sign_in_at,
    hubCount: hubCountMap.get(u.id) ?? 0,
    colCount: colCountMap.get(u.id) ?? 0,
  })).sort((a, b) => new Date(b.lastSignIn ?? 0).getTime() - new Date(a.lastSignIn ?? 0).getTime())

  // ── Tab nav ───────────────────────────────────────────────────────────────────

  const tabs = [
    { key: '',         label: 'Overview' },
    { key: 'feedback', label: `Feedback${newFeedback > 0 ? ` (${newFeedback})` : ''}` },
    { key: 'cards',    label: 'Welcome Cards' },
    { key: 'roadmap',  label: 'Roadmap' },
  ]
  const activeTab = tab ?? ''

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
              Admin
            </span>
            <span className="text-sm font-semibold text-gray-800">HubCollector</span>
          </div>
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            ← Dashboard
          </Link>
        </div>
        {/* Tab bar */}
        <div className="max-w-5xl mx-auto px-5 flex gap-0 border-t border-gray-100">
          {tabs.map(t => (
            <Link
              key={t.key}
              href={t.key ? `/admin?tab=${t.key}` : '/admin'}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.key
                  ? 'border-violet-500 text-violet-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8">

        {/* ── OVERVIEW ── */}
        {activeTab === '' && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              {[
                { label: 'Total Users',   value: authUsers.length },
                { label: 'Active 7d',     value: active7d },
                { label: 'Active 30d',    value: active30d },
                { label: 'Total Hubs',    value: hubs?.length ?? 0 },
                { label: 'Total Blocks',  value: totalBlocks ?? 0 },
                { label: 'New Feedback',  value: newFeedback, highlight: newFeedback > 0 },
              ].map(s => (
                <div key={s.label} className={`bg-white rounded-xl border px-4 py-3 ${s.highlight ? 'border-violet-200 bg-violet-50' : 'border-gray-200'}`}>
                  <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Users table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">Users ({authUsers.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                      <th className="text-left px-5 py-2.5 font-medium">Username</th>
                      <th className="text-left px-5 py-2.5 font-medium">Email</th>
                      <th className="text-left px-5 py-2.5 font-medium">Hubs</th>
                      <th className="text-left px-5 py-2.5 font-medium">Collections</th>
                      <th className="text-left px-5 py-2.5 font-medium">Last Sign-in</th>
                      <th className="text-left px-5 py-2.5 font-medium">Status</th>
                      <th className="px-5 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {userRows.map(u => {
                      const status = userStatus(u.lastSignIn, u.hubCount)
                      return (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 font-medium text-gray-800">@{u.username}</td>
                          <td className="px-5 py-3 text-gray-500">{u.email}</td>
                          <td className="px-5 py-3 text-gray-600">{u.hubCount}</td>
                          <td className="px-5 py-3 text-gray-600">{u.colCount}</td>
                          <td className="px-5 py-3 text-gray-400">{fmt(u.lastSignIn)}</td>
                          <td className="px-5 py-3">
                            <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${status.style}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <Link
                              href={`/admin/users/${u.id}`}
                              className="text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors"
                            >
                              View →
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── FEEDBACK ── */}
        {activeTab === 'feedback' && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-5">Feedback</h2>
            {feedback.length === 0 ? (
              <p className="text-sm text-stone-400 py-8 text-center">No feedback yet.</p>
            ) : (
              <FeedbackPanel initialFeedback={feedback} />
            )}
          </div>
        )}

        {/* ── WELCOME CARDS ── */}
        {activeTab === 'cards' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-400">
                localStorage key: <code className="bg-gray-100 px-1 rounded">hc_dismissed_cards</code> ·
                To resurface: bump version suffix in <code className="bg-gray-100 px-1 rounded">WelcomeCard.tsx</code>
              </p>
            </div>
            {CARDS.map((c, i) => (
              <div key={c.key} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-medium text-gray-400 w-5 text-center">{i + 1}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                      {c.label}
                    </span>
                    <span className="text-xs text-gray-400">{c.condition}</span>
                  </div>
                  <code className="text-[10px] text-gray-400 font-mono shrink-0">{c.key}</code>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1 ml-7">{c.title}</p>
                <p className="text-sm text-gray-500 leading-relaxed ml-7">{c.body}</p>
                {c.cta && (
                  <p className="text-xs text-blue-500 mt-2 ml-7">CTA: {c.cta}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── ROADMAP ── */}
        {activeTab === 'roadmap' && (
          <div className="space-y-5">
            {ROADMAP.map(section => (
              <div key={section.category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-700">{section.category}</h2>
                </div>
                <ul className="divide-y divide-gray-50">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 px-5 py-3">
                      <span className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center ${
                        item.done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                      }`}>
                        {item.done && (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </span>
                      <span className={`text-sm ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="text-xs text-gray-400 text-center">
              Edit roadmap in <code className="bg-gray-100 px-1 rounded">app/admin/page.tsx</code> → ROADMAP constant
            </p>
          </div>
        )}

      </main>
    </div>
  )
}
