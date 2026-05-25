
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HubForm from '@/components/HubForm'
import DeleteHubForm from '@/components/DeleteHubForm'

export default async function EditHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: hub } = await supabase
    .from('hubs')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!hub) notFound()

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
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
              ← Back
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Edit Hub</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/hub/${hub.id}/print`}
              className="text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              Print Card
            </Link>
            <DeleteHubForm hubId={hub.id} />
          </div>
        </div>
      </header>
      <main className="max-w-xl mx-auto px-4 py-8">
        <HubForm hub={hub} userId={user.id} />
      </main>
    </div>
  )
}
