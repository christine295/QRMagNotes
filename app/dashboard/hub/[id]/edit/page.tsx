
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HubForm from '@/components/HubForm'

export default async function EditHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: hub }, { data: profile }] = await Promise.all([
    supabase.from('hubs').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('profiles').select('username').eq('id', user.id).single(),
  ])

  if (!hub) notFound()

  const username: string = (profile as any)?.username ?? ''

  async function deleteHub() {
    'use server'
    const supabase = await createClient()
    await supabase.from('hubs').delete().eq('id', hub.id)
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back
            </Link>
            <div>
              <p className="text-xs text-gray-400 leading-none mb-0.5">Editing</p>
              <h1 className="text-base font-semibold text-gray-900 leading-none">{hub.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/h/${username}/${hub.slug}`}
              className="text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              View hub
            </Link>
            <Link
              href={`/dashboard/hub/${hub.id}/print`}
              className="text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              Print Card
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-xl mx-auto px-4 py-8">
        <HubForm hub={hub} userId={user.id} username={username} />
      </main>
    </div>
  )
}
