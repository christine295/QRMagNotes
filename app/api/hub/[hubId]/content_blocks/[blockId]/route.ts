import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ hubId: string; blockId: string }> }
) {
  const { blockId } = await context.params
  const supabase = await createClient()
  const body = await req.json()
  const updates: Record<string, any> = {}
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order
  if (body.data !== undefined) updates.data = body.data
  const { error } = await supabase
    .from('content_blocks')
    .update(updates)
    .eq('id', blockId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ hubId: string; blockId: string }> }
) {
  const { blockId } = await context.params
  const supabase = await createClient()
  const { error } = await supabase.from('content_blocks').delete().eq('id', blockId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
