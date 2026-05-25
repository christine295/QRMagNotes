import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
