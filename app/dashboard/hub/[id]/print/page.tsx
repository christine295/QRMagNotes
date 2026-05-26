import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PrintPreview from '@/components/PrintPreview'

export default async function PrintHubPage({ params }: { params: Promise<{ id: string }> }) {
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

  return <PrintPreview hub={hub} username={username} />
}
