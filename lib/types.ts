export type Profile = {
  id: string
  email: string
  created_at: string
}

export type Hub = {
  id: string
  user_id: string
  slug: string
  mode: 'landing' | 'redirect'
  redirect_url: string | null
  title: string
  description: string | null
  image_url: string | null
  theme_color: string | null
  collection_id?: string | null
  privacy_mode: 'public' | 'unlisted' | 'private'
  tags: string[]
  created_at: string
  updated_at: string
}
export type Collection = {
  id: string
  user_id: string
  title: string
  description: string | null
  cover_image: string | null
  theme_color: string | null
  created_at: string
  updated_at: string
}

export type ContentBlock = {
  id: string
  hub_id: string
  type: 'text' | 'image' | 'audio' | 'file' | 'link' | 'phone' | 'checklist' | 'timeline' | 'note'
  data: any
  sort_order: number
  created_at: string
  updated_at: string
}

export type HubLink = {
  id: string
  hub_id: string
  label: string
  url: string | null
  image_url?: string | null
  type: 'link' | 'phone' | 'note' | 'photo'
  sort_order: number
}
