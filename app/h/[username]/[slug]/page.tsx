import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HubView from '@/components/HubView'

export default async function PublicHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string; slug: string }>
  searchParams: Promise<{ save?: string }>
}) {
  const [{ username, slug }, { save: autoSaveParam }] = await Promise.all([params, searchParams])
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const { data: hub } = await supabase
    .from('hubs')
    .select('*')
    .eq('user_id', profile.id)
    .eq('slug', slug)
    .single()

  if (!hub) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === hub.user_id

  if (hub.privacy_mode === 'private') {
    if (!user) {
      return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
          <div className="text-center px-6">
            <div className="text-5xl mb-4 select-none">&#128274;</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">This hub is private</h1>
            <p className="text-base text-gray-500 mb-6">Sign in as the owner to view this hub.</p>
            <a
              href={`/login?next=/h/${username}/${slug}`}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
            >
              Sign in
            </a>
          </div>
        </div>
      )
    }
    if (user.id !== hub.user_id) {
      return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
          <div className="text-center px-6">
            <div className="text-5xl mb-4 select-none">&#128274;</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">This hub is private</h1>
            <p className="text-base text-gray-500">You don&apos;t have permission to view this hub.</p>
          </div>
        </div>
      )
    }
  }

  if (hub.mode === 'redirect' && hub.redirect_url) {
    redirect(hub.redirect_url)
  }

  const { data: contentBlocks } = await supabase
    .from('content_blocks')
    .select('*')
    .eq('hub_id', hub.id)
    .order('sort_order')

  // Pre-fetch hubs for any collection_menu blocks (owned + saved hubs)
  const menuBlocks = (contentBlocks ?? []).filter((b: any) => b.type === 'collection_menu')
  const collectionHubs: Record<string, any[]> = {}

  await Promise.all(menuBlocks.map(async (block: any) => {
    const { collection_id, excluded_hub_ids = [] } = block.data ?? {}
    if (!collection_id) return

    // Owned hubs in the collection
    const { data: ownedHubs } = await supabase
      .from('hubs')
      .select('id, title, description, theme_color, slug, privacy_mode, template_id')
      .eq('collection_id', collection_id)
      .order('updated_at', { ascending: false })

    const filteredOwned = (ownedHubs ?? [])
      .filter((h: any) => !excluded_hub_ids.includes(h.id))
      .map((h: any) => ({ ...h, owner_username: username }))

    // Saved hubs the page owner assigned to this collection
    // RLS policy allows reading saved_hubs where collection_id IS NOT NULL and hub is non-private
    const { data: savedRows } = await supabase
      .from('saved_hubs')
      .select('hub_id, hubs(id, title, description, theme_color, slug, privacy_mode, template_id, user_id)')
      .eq('collection_id', collection_id)
      .eq('user_id', profile.id)

    let savedHubsForMenu: any[] = []
    if (savedRows && savedRows.length > 0) {
      const ownerIds = [...new Set(savedRows.map((r: any) => r.hubs?.user_id).filter(Boolean))]
      const { data: ownerProfiles } = ownerIds.length > 0
        ? await supabase.from('profiles').select('id, username').in('id', ownerIds)
        : { data: [] }

      const uMap: Record<string, string> = {}
      ;(ownerProfiles ?? []).forEach((p: any) => { uMap[p.id] = p.username })

      savedHubsForMenu = savedRows
        .filter((r: any) => r.hubs && !excluded_hub_ids.includes(r.hubs.id) && r.hubs.privacy_mode !== 'private')
        .map((r: any) => ({ ...r.hubs, owner_username: uMap[r.hubs.user_id] ?? null }))
    }

    // Merge, dedup by id (owned hubs take precedence)
    const seen = new Set<string>(filteredOwned.map((h: any) => h.id))
    const merged = [...filteredOwned, ...savedHubsForMenu.filter((h: any) => !seen.has(h.id))]
    collectionHubs[block.id] = merged
  }))

  // Fetch heart count (visible to everyone)
  const { count: heartCount } = await supabase
    .from('hub_hearts')
    .select('*', { count: 'exact', head: true })
    .eq('hub_id', hub.id)

  // Fetch save/heart state for logged-in non-owners
  let isSaved = false
  let userHearted = false

  if (user && !isOwner) {
    const [{ data: savedHub }, { data: heartRow }] = await Promise.all([
      supabase.from('saved_hubs').select('id').eq('user_id', user.id).eq('hub_id', hub.id).single(),
      supabase.from('hub_hearts').select('id').eq('user_id', user.id).eq('hub_id', hub.id).single(),
    ])
    isSaved = !!savedHub
    userHearted = !!heartRow

    // Update last_viewed_at if this hub is saved (best-effort)
    if (savedHub) {
      try {
        await supabase
          .from('saved_hubs')
          .update({ last_viewed_at: new Date().toISOString() })
          .eq('id', savedHub.id)
      } catch {}
    }
  }

  const color = hub.theme_color ?? '#3B82F6'
  // Auto-save: triggered when returning from login with ?save=1 and hub not already saved
  const autoSave = autoSaveParam === '1' && !!user && !isOwner && !isSaved

  return (
    <HubView
      hub={hub}
      blocks={contentBlocks ?? []}
      color={color}
      isOwner={isOwner}
      username={username}
      collectionHubs={collectionHubs}
      currentUserId={user?.id ?? null}
      isSaved={isSaved}
      heartCount={heartCount ?? 0}
      userHearted={userHearted}
      autoSave={autoSave}
    />
  )
}
