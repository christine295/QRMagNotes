import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function PublicHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: hub } = await supabase
    .from('hubs')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!hub) notFound()

  if (hub.mode === 'redirect' && hub.redirect_url) {
    redirect(hub.redirect_url)
  }

  const { data: links } = await supabase
    .from('hub_links')
    .select('*')
    .eq('hub_id', hub.id)
    .order('sort_order')

  const color = hub.theme_color ?? '#3B82F6'

  return (
    <div className="min-h-screen bg-gray-50">
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
        {links && links.length > 0 ? (
          links.map(link => {
            // Phone: clickable tel: link
            if (link.type === 'phone' && link.url) {
              return (
                <a
                  key={link.id}
                  href={`tel:${link.url}`}
                  className="flex items-center justify-center w-full font-medium py-4 px-6 rounded-xl shadow-sm text-white text-base transition-opacity active:opacity-80"
                  style={{ backgroundColor: color }}
                >
                  {link.label || link.url}
                </a>
              )
            }
            // File: show preview or download link
            if (link.type === 'file' && link.image_url) {
              const isPDF = link.image_url.endsWith('.pdf')
              return (
                <a
                  key={link.id}
                  href={link.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full font-medium py-4 px-6 rounded-xl shadow-sm text-white text-base transition-opacity active:opacity-80 gap-2"
                  style={{ backgroundColor: color }}
                >
                  {isPDF ? (
                    <span>📄 {link.label || 'PDF File'}</span>
                  ) : (
                    <>
                      <img src={link.image_url} alt={link.label || ''} className="h-6 w-6 rounded object-cover mr-2" />
                      {link.label || 'Image'}
                    </>
                  )}
                </a>
              )
            }
            // Note: render as non-clickable
            if (link.type === 'note') {
              return (
                <div
                  key={link.id}
                  className="flex flex-col items-start w-full font-medium py-4 px-6 rounded-xl border-2 text-gray-600 text-base"
                  style={{ borderColor: color, color }}
                >
                  {link.label && <div className="font-semibold mb-1">{link.label}</div>}
                  <div className="whitespace-pre-line text-sm text-gray-700">{link.url}</div>
                </div>
              )
            }
            // Default: clickable link or label
            if (link.url) {
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full font-medium py-4 px-6 rounded-xl shadow-sm text-white text-base transition-opacity active:opacity-80"
                  style={{ backgroundColor: color }}
                >
                  {link.label}
                </a>
              )
            }
            return (
              <div
                key={link.id}
                className="flex items-center justify-center w-full font-medium py-4 px-6 rounded-xl border-2 text-gray-600 text-base"
                style={{ borderColor: color, color }}
              >
                {link.label}
              </div>
            )
          })
        ) : (
          <p className="text-center text-gray-400 text-sm py-12">No links added yet.</p>
        )}
      </main>

      <footer className="text-center py-10 text-xs text-gray-300">
        QRMagNotes
      </footer>
    </div>
  )
}
