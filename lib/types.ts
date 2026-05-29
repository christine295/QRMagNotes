export type Profile = {
  id: string
  email: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  social_links: { label: string; url: string }[]
  saved_count?: number
  badges?: string[]
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
  template_id?: string | null
  privacy_mode: 'public' | 'unlisted' | 'private'
  tags: string[]
  created_at: string
  updated_at: string
  save_count?: number
  heart_count?: number
  view_count?: number
  share_count?: number
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
  type: 'text' | 'image' | 'audio' | 'file' | 'link' | 'phone' | 'checklist' | 'timeline' | 'note' | 'collection_menu'
  data: any
  sort_order: number
  created_at: string
  updated_at: string
}

export type SavedHub = {
  id: string
  user_id: string
  hub_id: string
  collection_id: string | null
  last_viewed_at: string | null
  created_at: string
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
