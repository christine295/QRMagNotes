import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useCollections(userId: string) {
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCollections() {
      const supabase = createClient()
      const { data } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      setCollections(data || [])
      setLoading(false)
    }
    fetchCollections()
  }, [userId])

  return { collections, setCollections, loading }
}
