import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChecklistBlock from '@/components/ChecklistBlock'

export default async function PublicHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: hub } = await supabase
    .from('hubs')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!hub) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === hub.user_id

  if (hub.privacy_mode === 'private') {
    if (!user) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="text-5xl mb-4 select-none">&#128274;</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">This hub is private</h1>
            <p className="text-sm text-gray-500 mb-6">Sign in as the owner to view this hub.</p>
            <a
              href={`/login?next=/h/${slug}`}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Sign in
            </a>
          </div>
        </div>
      )
    }
    if (user.id !== hub.user_id) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="text-5xl mb-4 select-none">&#128274;</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">This hub is private</h1>
            <p className="text-sm text-gray-500">You don't have permission to view this hub.</p>
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

  const color = hub.theme_color ?? '#3B82F6'

  return (
    <div className="min-h-screen bg-gray-50">
      {isOwner && (
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">You are viewing your hub</span>
          <a
            href={`/dashboard/hub/${hub.id}/edit`}
            className="text-xs font-medium text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
          >
            Edit hub
          </a>
        </div>
      )}
      <div className="px-4 py-10 text-center text-white" style={{ backgroundColor: color }}>
        {hub.image_url && (
          <img
            src={hub.image_url}
            alt=""
            className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4 shadow"
          />
        )}
        <h1 className="text-2xl font-bold">{hub.title}</h1>
        {hub.description && (
          <p className="mt-2 text-sm text-white/80 max-w-xs mx-auto leading-relaxed">
            {hub.description}
          </p>
        )}
      </div>

      <main className="max-w-sm mx-auto px-4 py-6 space-y-3">
        {contentBlocks && contentBlocks.length > 0 ? (
          contentBlocks.map(block => {
            const d = block.data as any

            if (block.type === 'link') {
              return (
                <a
                  key={block.id}
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full font-medium py-4 px-6 rounded-xl shadow-sm text-white text-base transition-opacity active:opacity-80"
                  style={{ backgroundColor: color }}
                >
                  {d.label || d.url}
                </a>
              )
            }

            if (block.type === 'phone') {
              return (
                <a
                  key={block.id}
                  href={`tel:${d.url}`}
                  className="flex items-center justify-center w-full font-medium py-4 px-6 rounded-xl shadow-sm text-white text-base transition-opacity active:opacity-80"
                  style={{ backgroundColor: color }}
                >
                  {d.label || d.url}
                </a>
              )
            }

            if (block.type === 'file') {
              const isPDF = d.url?.toLowerCase().endsWith('.pdf')
              return (
                <a
                  key={block.id}
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full font-medium py-4 px-6 rounded-xl shadow-sm text-white text-base transition-opacity active:opacity-80 gap-2"
                  style={{ backgroundColor: color }}
                >
                  {isPDF ? `📄 ${d.label || 'PDF File'}` : (d.label || 'File')}
                </a>
              )
            }

            if (block.type === 'audio') {
              return (
                <div key={block.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  {d.label && <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color }}>{d.label}</p>}
                  {d.date && (
                    <p className="text-xs text-gray-400 mb-2">
                      {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                  <audio src={d.url} controls className="w-full" />
                </div>
              )
            }

            if (block.type === 'text') {
              return (
                <div key={block.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  {d.label && <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color }}>{d.label}</p>}
                  {d.date && (
                    <p className="text-xs text-gray-400 mb-2">
                      {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{d.text}</p>
                </div>
              )
            }

            if (block.type === 'checklist') {
              return (
                <ChecklistBlock
                  key={block.id}
                  blockId={block.id}
                  label={d.label ?? ''}
                  items={d.items ?? []}
                  color={color}
                />
              )
            }

            if (block.type === 'image') {
              if (!d.url) return null
              return (
                <div key={block.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <img src={d.url} alt={d.caption || ''} className="w-full object-cover" />
                  {d.caption && <p className="text-xs text-gray-500 px-4 py-2">{d.caption}</p>}
                </div>
              )
            }

            if (block.type === 'timeline') {
              return (
                <div key={block.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  {d.label && <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color }}>{d.label}</p>}
                  <div className="relative pl-5 border-l-2" style={{ borderColor: color + '40' }}>
                    {(d.events ?? []).map((event: any, i: number) => (
                      <div key={event.id ?? i} className="mb-3 last:mb-0 relative">
                        <span className="absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: color }} />
                        {event.date && <p className="text-xs text-gray-400 mb-0.5">{event.date}</p>}
                        <p className="text-sm text-gray-700">{event.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }

            return null
          })
        ) : (
          <p className="text-center text-gray-400 text-sm py-12">No content added yet.</p>
        )}
      </main>

      <footer className="text-center py-10 text-xs text-gray-300">
        © 2026 QRMagNotes | Developed by{' '}
        <a href="https://websketching.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors underline">
          Websketching
        </a>
      </footer>
    </div>
  )
}
