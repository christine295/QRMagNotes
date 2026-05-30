import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ModerationPanel from '@/components/ModerationPanel'

const ADMIN_EMAIL = 'christine@websketching.com'

function fmt(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const TEMPLATE_LABELS: Record<string, string> = {
  artwork: 'Artwork Archive', book: 'Book Notes', diary: 'Diary / Life Log',
  garden: 'Garden Planner', goal: 'Goal Tracker', grocery: 'Grocery List',
  hub_collector: 'Hub Menu', journal: 'Daily Reflection', maintenance: 'Home Maintenance',
  packing: 'Packing List', pet: 'Pet Profile', plant: 'Plant Profile',
  recipe: 'Recipe', ritual: 'Ritual', shadow_work: 'Shadow Work',
  travel: 'Travel Journal', vehicle: 'Vehicle', box: "What's in the Box?",
  workout: 'Workout',
}

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) redirect('/dashboard')

  const adminClient = createAdminClient()

  const [
    { data: { user: authUser } },
    { data: profile },
    { data: hubs },
    { data: collections },
    { data: blocks },
  ] = await Promise.all([
    adminClient.auth.admin.getUserById(id),
    adminClient.from('profiles').select('*, account_status').eq('id', id).single(),
    adminClient.from('hubs').select('id, title, slug, mode, privacy_mode, template_id, updated_at, created_at').eq('user_id', id).order('updated_at', { ascending: false }),
    adminClient.from('collections').select('id, title, created_at').eq('user_id', id).order('title'),
    adminClient.from('content_blocks').select('hub_id').in('hub_id', []),
  ])

  // Block counts per hub
  const allHubIds = (hubs ?? []).map(h => h.id)
  const { data: allBlocks } = allHubIds.length > 0
    ? await adminClient.from('content_blocks').select('hub_id').in('hub_id', allHubIds)
    : { data: [] }

  const blockCountByHub = new Map<string, number>()
  for (const b of allBlocks ?? []) {
    blockCountByHub.set(b.hub_id, (blockCountByHub.get(b.hub_id) ?? 0) + 1)
  }
  const totalBlocks = allBlocks?.length ?? 0

  const username = profile?.username ?? authUser?.email?.split('@')[0] ?? id.slice(0, 8)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin banner */}
      <div className="bg-red-600 text-white px-5 py-2.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5 text-sm font-medium">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Admin Access — Viewing @{username}'s account — Read Only
        </div>
        <Link href="/admin" className="text-xs text-red-200 hover:text-white transition-colors font-medium">
          ← Exit Admin View
        </Link>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">@{username}</h1>
            <p className="text-sm text-gray-400">{authUser?.email}</p>
          </div>
          <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Admin
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-8 space-y-6">

        {/* Profile + Stats */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Profile</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2"><dt className="text-gray-400 w-28 shrink-0">Username</dt><dd className="text-gray-800 font-medium">@{username}</dd></div>
              <div className="flex gap-2"><dt className="text-gray-400 w-28 shrink-0">Email</dt><dd className="text-gray-700">{authUser?.email ?? '—'}</dd></div>
              <div className="flex gap-2"><dt className="text-gray-400 w-28 shrink-0">Display name</dt><dd className="text-gray-700">{profile?.display_name ?? '—'}</dd></div>
              <div className="flex gap-2"><dt className="text-gray-400 w-28 shrink-0">Bio</dt><dd className="text-gray-700">{profile?.bio ?? '—'}</dd></div>
              <div className="flex gap-2"><dt className="text-gray-400 w-28 shrink-0">Badges</dt><dd className="text-gray-700">{profile?.badges?.join(', ') || '—'}</dd></div>
              <div className="flex gap-2"><dt className="text-gray-400 w-28 shrink-0">Signed up</dt><dd className="text-gray-700">{fmt(profile?.created_at)}</dd></div>
              <div className="flex gap-2"><dt className="text-gray-400 w-28 shrink-0">Last sign-in</dt><dd className="text-gray-700">{fmt(authUser?.last_sign_in_at)}</dd></div>
            </dl>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Activity</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Hubs',        value: hubs?.length ?? 0 },
                { label: 'Collections', value: collections?.length ?? 0 },
                { label: 'Blocks',      value: totalBlocks },
                { label: 'Saved Hubs',  value: profile?.saved_count ?? 0 },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-lg px-3 py-2.5">
                  <p className="text-xl font-semibold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Moderation */}
        <ModerationPanel
          userId={id}
          username={username}
          initialStatus={(profile?.account_status as any) ?? 'active'}
          hubCount={hubs?.length ?? 0}
        />

        {/* Hubs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Hubs ({hubs?.length ?? 0})</h2>
          </div>
          {(hubs?.length ?? 0) === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-400">No hubs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                    <th className="text-left px-5 py-2.5 font-medium">Title</th>
                    <th className="text-left px-5 py-2.5 font-medium">Template</th>
                    <th className="text-left px-5 py-2.5 font-medium">Mode</th>
                    <th className="text-left px-5 py-2.5 font-medium">Privacy</th>
                    <th className="text-left px-5 py-2.5 font-medium">Blocks</th>
                    <th className="text-left px-5 py-2.5 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(hubs ?? []).map(h => (
                    <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-800">{h.title}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{h.template_id ? (TEMPLATE_LABELS[h.template_id] ?? h.template_id) : '—'}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs capitalize">{h.mode}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs capitalize">{h.privacy_mode}</td>
                      <td className="px-5 py-3 text-gray-600">{blockCountByHub.get(h.id) ?? 0}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{fmt(h.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Collections */}
        {(collections?.length ?? 0) > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Collections ({collections?.length})</h2>
            </div>
            <ul className="divide-y divide-gray-50">
              {(collections ?? []).map(c => (
                <li key={c.id} className="px-5 py-3 flex items-center justify-between">
                  <span className="text-sm text-gray-700">{c.title}</span>
                  <span className="text-xs text-gray-400">{fmt(c.created_at)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </main>
    </div>
  )
}
