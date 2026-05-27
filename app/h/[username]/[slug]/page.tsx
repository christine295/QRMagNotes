import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HubView from '@/components/HubView'

export default async function PublicHubPage({ params }: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = await params
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

  // Pre-fetch hubs for any collection_menu blocks
  const menuBlocks = (contentBlocks ?? []).filter((b: any) => b.type === 'collection_menu')
  const collectionHubs: Record<string, any[]> = {}

  await Promise.all(menuBlocks.map(async (block: any) => {
    const { collection_id, excluded_hub_ids = [] } = block.data ?? {}
    if (!collection_id) return
    const { data: hubs } = await supabase
      .from('hubs')
      .select('id, title, description, theme_color, slug, privacy_mode, template_id')
      .eq('collection_id', collection_id)
      .order('updated_at', { ascending: false })
    // RLS already filters private hubs for non-owners; also remove explicitly excluded ones
    collectionHubs[block.id] = (hubs ?? []).filter((h: any) => !excluded_hub_ids.includes(h.id))
  }))

  const color = hub.theme_color ?? '#3B82F6'

  return (
    <HubView
      hub={hub}
      blocks={contentBlocks ?? []}
      color={color}
      isOwner={isOwner}
      username={username}
      collectionHubs={collectionHubs}
    />
  )
}
