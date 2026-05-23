import { createClient } from './client'

// Accepts image or PDF file, uploads to Supabase Storage, returns public URL
export async function uploadPhoto(file: File, hubId: string, linkIndex: number): Promise<string | null> {
  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const filePath = `${hubId}/${Date.now()}_${linkIndex}.${fileExt}`
  console.log('Uploading file:', file)
  const { data, error } = await supabase.storage.from('hub-photos').upload(filePath, file)
  if (error) {
    console.error('Supabase upload error:', error)
    return null
  }
  const { data: urlData } = supabase.storage.from('hub-photos').getPublicUrl(filePath)
  console.log('Upload success, public URL:', urlData?.publicUrl)
  return urlData?.publicUrl ?? null
}
