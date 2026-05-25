
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HubForm from '@/components/HubForm'
import { useSearchParams } from 'next/navigation'

export default async function NewHubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Read ?collection= param
  const searchParams = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search)
  const collectionId = searchParams?.get('collection') || undefined

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Create Hub</h1>
        </div>
      </header>
      <main className="max-w-xl mx-auto px-4 py-8">
        <HubForm userId={user.id} initialCollectionId={collectionId} />
      </main>
    </div>
  )
}
