import { createClient } from './client'

export async function uploadAudio(file: Blob | File, hubId: string): Promise<string | null> {
  const supabase = createClient()
  const ext = file instanceof File ? (file.name.split('.').pop() ?? 'webm') : 'webm'
  const filePath = `${hubId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('hub-audio').upload(filePath, file)
  if (error) {
    console.error('Audio upload error:', error)
    return null
  }
  const { data: urlData } = supabase.storage.from('hub-audio').getPublicUrl(filePath)
  return urlData?.publicUrl ?? null
}
