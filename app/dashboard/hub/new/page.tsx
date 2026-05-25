
"use client";
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import HubForm from '@/components/HubForm'
import { useRouter, useSearchParams } from 'next/navigation'

export default function NewHubPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const collectionId = searchParams.get('collection') || undefined
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }
      setUserId(user.id)
      setLoading(false)
    }
    fetchUser()
  }, [router])

  if (loading || !userId) {
    return <div className="p-8 text-center text-gray-400">Loading...</div>
  }

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
