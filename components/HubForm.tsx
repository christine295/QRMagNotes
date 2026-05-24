'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Hub, HubLink } from '@/lib/types'
import LinkEditor from './LinkEditor'
import { uploadPhoto } from '@/lib/supabase/uploadPhoto'

const THEME_COLORS = [
  { value: '#3B82F6', label: 'Blue' },
  { value: '#22C55E', label: 'Green' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#F43F5E', label: 'Rose' },
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#F97316', label: 'Orange' },
  { value: '#64748B', label: 'Slate' },
]

type LinkDraft = Omit<HubLink, 'id' | 'hub_id'>

type Template = {
  id: string
  label: string
  emoji: string
  description: string
  title: string
  hubDescription: string
  themeColor: string
  links: LinkDraft[]
}

const TEMPLATES: Template[] = [
  {
    id: 'blank',
    label: 'Blank',
    emoji: '➕',
    description: 'Start from scratch',
    title: '',
    hubDescription: '',
    themeColor: '#3B82F6',
    links: [],
  },
  {
    id: 'artwork',
    label: 'Artwork Memory Hub',
    emoji: '🎨',
    description: 'Attach to the back of a painting or piece of art',
    title: 'Artwork Memory Hub',
    hubDescription: 'The story, songs, symbols, and notes connected to this piece.',
    themeColor: '#8B5CF6',
    links: [
      { label: 'Spotify Playlist', url: '', sort_order: 0, type: 'link' },
      { label: 'Artist Notes', url: '', sort_order: 1, type: 'link' },
      { label: 'Moon Phase', url: '', sort_order: 2, type: 'link' },
      { label: 'Inspiration', url: '', sort_order: 3, type: 'link' },
      { label: 'Color Palette', url: '', sort_order: 4, type: 'link' },
      { label: 'Process Photos', url: '', sort_order: 5, type: 'link' },
      { label: 'Materials Used', url: '', sort_order: 6, type: 'link' },
      { label: 'Private Notes', url: '', sort_order: 7, type: 'link' },
    ],
  },
]

type Props = {
  hub?: Hub
  existingLinks?: HubLink[]
  userId: string
}

function slugify(val: string) {
  return val
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function HubForm({ hub, existingLinks, userId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()
  const isEditing = !!hub

  const [templateChosen, setTemplateChosen] = useState(isEditing)

  const [title, setTitle] = useState(hub?.title ?? '')
  const [slug, setSlug] = useState(hub?.slug ?? '')
  const [mode, setMode] = useState<'landing' | 'redirect'>(
    (hub?.mode as 'landing' | 'redirect') ?? 'landing'
  )
  const [redirectUrl, setRedirectUrl] = useState(hub?.redirect_url ?? '')
  const [description, setDescription] = useState(hub?.description ?? '')
  const [imageUrl, setImageUrl] = useState(hub?.image_url ?? '')
  const [themeColor, setThemeColor] = useState(hub?.theme_color ?? '#3B82F6')
  const [links, setLinks] = useState<LinkDraft[]>(
    existingLinks?.map(l => ({
      label: l.label,
      url: l.url,
      type: l.type ?? 'link',
      image_url: l.image_url,
      sort_order: l.sort_order
    })) ?? []
  )
  const [error, setError] = useState('')
  const [slugError, setSlugError] = useState('')

  function applyTemplate(t: Template) {
    setTitle(t.title)
    setSlug(slugify(t.title))
    setDescription(t.hubDescription)
    setThemeColor(t.themeColor)
    setLinks(t.links)
    setTemplateChosen(true)
  }

  if (!templateChosen) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500 mb-4">Choose a starting point:</p>
        {TEMPLATES.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => applyTemplate(t)}
            className="w-full flex items-center gap-4 border border-gray-200 rounded-xl p-4 text-left hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <span className="text-3xl">{t.emoji}</span>
            <div>
              <div className="font-medium text-gray-900 text-sm">{t.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{t.description}</div>
            </div>
          </button>
        ))}
      </div>
    )
  }

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!isEditing) setSlug(slugify(val))
  }

  function handleSlugChange(val: string) {
    setSlug(slugify(val))
    setSlugError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSlugError("")

    if (!slug) {
      setSlugError("Slug is required")
      return
    }

    startTransition(async () => {
      let hubId = hub?.id
      if (isEditing) {
        const { error: hubError } = await supabase
          .from("hubs")
          .update({
            title,
            slug,
            mode,
            redirect_url: mode === "redirect" ? redirectUrl : null,
            description: mode === "landing" ? description || null : null,
            image_url: mode === "landing" ? imageUrl || null : null,
            theme_color: themeColor,
          })
          .eq("id", hub.id)

        if (hubError) {
          if (hubError.code === "23505") setSlugError("That slug is already taken")
          else setError(hubError.message)
          return
        }

        // Always delete old links before inserting new
        const { error: deleteLinksError } = await supabase.from("hub_links").delete().eq("hub_id", hub.id)
        if (deleteLinksError) {
          setError("Failed to delete old links: " + deleteLinksError.message)
          return
        }
      } else {
        const { data: newHub, error: hubError } = await supabase
          .from("hubs")
          .insert({
            user_id: userId,
            title,
            slug,
            mode,
            redirect_url: mode === "redirect" ? redirectUrl : null,
            description: mode === "landing" ? description || null : null,
            image_url: mode === "landing" ? imageUrl || null : null,
            theme_color: themeColor,
          })
          .select()
          .single()

        if (hubError) {
          if (hubError.code === "23505") setSlugError("That slug is already taken")
          else setError(hubError.message)
          return
        }
        hubId = newHub.id
      }

      // Upload photos and prepare links

      let linksWithFiles: LinkDraft[] = []
      try {
        linksWithFiles = await Promise.all(
          links.map(async (l, i) => {
            if (l.type === "photo" && l.file) {
              const url = await uploadPhoto(l.file, hubId!, i)
              if (!url) {
                setError("File upload failed: Could not get public URL. Check console for details.")
                throw new Error("File upload failed")
              }
              const { file, ...rest } = l
              return { ...rest, url: null, image_url: url }
            }
            // Always remove the file property before saving
            const { file, ...rest } = l
            return rest
          })
        )
      } catch (err: any) {
        setError("File upload failed: " + (err?.message || err))
        console.error('File upload error:', err)
        return
      }

      // Always attempt to insert links (even if empty, to clear old)

      if (hubId) {
        const { error: insertLinksError } = await supabase.from("hub_links").insert(
          linksWithFiles.map((l, i) => ({ ...l, hub_id: hubId, sort_order: i }))
        )
        if (insertLinksError) {
          setError("Failed to save links: " + insertLinksError.message)
          return
        }
      }

      router.push("/dashboard")
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Hub title</label>
        <input
          type="text"
          required
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
          placeholder="e.g. Home Hub, Workshop, Office"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
          <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-300 select-none">
            /h/
          </span>
          <input
            type="text"
            required
            value={slug}
            onChange={e => handleSlugChange(e.target.value)}
            placeholder="our-home"
            className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
          />
        </div>
        {slugError ? (
          <p className="text-red-500 text-xs mt-1">{slugError}</p>
        ) : (
          <p className="text-gray-400 text-xs mt-1">
            The permanent URL your QR code will always point to.
            {isEditing && ' Changing the slug will break existing printed QR codes.'}
          </p>
        )}
      </div>

      {/* Mode selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode('landing')}
            className={`border rounded-xl p-4 text-left transition-colors ${
              mode === 'landing'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className={`font-medium text-sm ${mode === 'landing' ? 'text-blue-700' : 'text-gray-700'}`}>
              Landing Page
            </div>
            <div className="text-xs text-gray-400 mt-0.5">Show a page with links</div>
          </button>
          <button
            type="button"
            onClick={() => setMode('redirect')}
            className={`border rounded-xl p-4 text-left transition-colors ${
              mode === 'redirect'
                ? 'border-amber-500 bg-amber-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className={`font-medium text-sm ${mode === 'redirect' ? 'text-amber-700' : 'text-gray-700'}`}>
              Redirect
            </div>
            <div className="text-xs text-gray-400 mt-0.5">Send visitors to a URL</div>
          </button>
        </div>
      </div>

      {/* Redirect mode fields */}
      {mode === 'redirect' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Destination URL</label>
          <input
            type="url"
            required
            value={redirectUrl}
            onChange={e => setRedirectUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Landing page fields */}
      {mode === 'landing' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A short message shown on the public page"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hub Image <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="file"
                accept="image/*"
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setError("")
                    const url = await uploadPhoto(file, slug || 'temp', 0)
                    if (url) setImageUrl(url)
                    else setError("Image upload failed. Check console for details.")
                  }
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {imageUrl && (
              <img src={imageUrl} alt="Hub image preview" className="mt-2 h-16 rounded-xl object-cover border" />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme color</label>
            <div className="flex gap-2 flex-wrap">
              {THEME_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setThemeColor(c.value)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    themeColor === c.value
                      ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Links</label>
            <LinkEditor links={links} onChange={setLinks} />
          </div>
        </>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
        >
          {isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Create hub'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
