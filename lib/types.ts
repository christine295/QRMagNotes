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
