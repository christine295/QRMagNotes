import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = 'christine@websketching.com'
const ACTIONS = ['restrict', 'unrestrict', 'suspend', 'unsuspend'] as const
type Action = typeof ACTIONS[number]

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { action } = await req.json() as { action: Action }
  if (!ACTIONS.includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  if (action === 'suspend') {
    const [authResult, profileResult] = await Promise.all([
      adminClient.auth.admin.updateUserById(id, { ban_duration: '876000h' }),
      adminClient.from('profiles').update({ account_status: 'suspended' }).eq('id', id),
    ])
    if (authResult.error) return NextResponse.json({ error: authResult.error.message }, { status: 500 })
    if (profileResult.error) return NextResponse.json({ error: profileResult.error.message }, { status: 500 })
  }

  if (action === 'unsuspend') {
    const [authResult, profileResult] = await Promise.all([
      adminClient.auth.admin.updateUserById(id, { ban_duration: 'none' }),
      adminClient.from('profiles').update({ account_status: 'active' }).eq('id', id),
    ])
    if (authResult.error) return NextResponse.json({ error: authResult.error.message }, { status: 500 })
    if (profileResult.error) return NextResponse.json({ error: profileResult.error.message }, { status: 500 })
  }

  if (action === 'restrict') {
    const { error } = await adminClient
      .from('profiles').update({ account_status: 'restricted' }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (action === 'unrestrict') {
    const { error } = await adminClient
      .from('profiles').update({ account_status: 'active' }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
