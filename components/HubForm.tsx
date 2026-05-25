'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Hub, Collection } from '@/lib/types'
import { useCollections } from './useCollections'
import ContentBlocksEditor from './ContentBlocksEditor'
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

type Template = {
  id: string
  label: string
  emoji: string
  description: string
  title: string
  hubDescription: string
  themeColor: string
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
  },
  {
    id: 'artwork',
    label: 'Artwork Memory Hub',
    emoji: '🎨',
    description: 'Attach to the back of a painting or piece of art',
    title: 'Artwork Memory Hub',
    hubDescription: 'The story, songs, symbols, and notes connected to this piece.',
    themeColor: '#8B5CF6',
  },
  {
    id: 'ritual',
    label: 'Ritual Template',
    emoji: '🕯️',
    description: 'Document and revisit sacred rituals',
    title: 'My Ritual',
    hubDescription: 'A space to capture the intention, steps, and reflections of this ritual.',
    themeColor: '#8B5CF6',
  },
]

const RITUAL_BLOCKS = [
  {
    type: 'text' as const,
    data: {
      label: 'Ritual Overview',
      text: 'Ritual Name:\n\nDate / Season / Moon Phase:\n\nIntention:\n\nLocation:\n\nWho is participating:',
    },
  },
  {
    type: 'checklist' as const,
    data: {
      label: 'Ritual Setup',
      items: [
        { id: 'rs-1', text: 'Cleanse the space', checked: false },
        { id: 'rs-2', text: 'Prepare altar or ritual area', checked: false },
        { id: 'rs-3', text: 'Gather candles', checked: false },
        { id: 'rs-4', text: 'Gather herbs, crystals, tools, or offerings', checked: false },
        { id: 'rs-5', text: 'Prepare music or playlist', checked: false },
        { id: 'rs-6', text: 'Set water, journal, or divination tools nearby', checked: false },
        { id: 'rs-7', text: 'Silence phone / reduce distractions', checked: false },
        { id: 'rs-8', text: 'Ground and center', checked: false },
      ],
    },
  },
  {
    type: 'text' as const,
    data: {
      label: 'Correspondences',
      text: 'Colors:\n\nHerbs / Plants:\n\nCrystals / Stones:\n\nElements:\n\nDeities / Spirits / Guides:\n\nSymbols:\n\nOfferings:\n\nTarot / Oracle Cards:\n\nOther Notes:',
    },
  },
  {
    type: 'checklist' as const,
    data: {
      label: 'Ritual Steps',
      items: [
        { id: 'rstep-1', text: 'Opening / grounding', checked: false },
        { id: 'rstep-2', text: 'Cleanse or bless the space', checked: false },
        { id: 'rstep-3', text: 'Cast circle or create sacred space', checked: false },
        { id: 'rstep-4', text: 'Call quarters / invite guides', checked: false },
        { id: 'rstep-5', text: 'Invocation or prayer', checked: false },
        { id: 'rstep-6', text: 'Main ritual working', checked: false },
        { id: 'rstep-7', text: 'Meditation / silence / divination', checked: false },
        { id: 'rstep-8', text: 'Offerings or gratitude', checked: false },
        { id: 'rstep-9', text: 'Closing words', checked: false },
        { id: 'rstep-10', text: 'Release quarters / close circle', checked: false },
        { id: 'rstep-11', text: 'Final grounding', checked: false },
      ],
    },
  },
  {
    type: 'text' as const,
    data: {
      label: 'Invocation / Words to Speak',
      text: '',
    },
  },
  {
    type: 'link' as const,
    data: {
      label: 'Ritual Playlist',
      url: '',
    },
  },
  {
    type: 'audio' as const,
    data: {
      label: 'Voice Reflections',
      url: '',
    },
  },
  {
    type: 'text' as const,
    data: {
      label: 'Ritual Notes',
      text: 'What energy did I feel before beginning?\n\nWhat shifted during the ritual?\n\nWhat signs, symbols, or synchronicities appeared?\n\nWhat emotions came up?\n\nWhat did I learn?\n\nWhat do I want to remember next time?',
    },
  },
  {
    type: 'image' as const,
    data: {
      url: '',
      caption: 'Photos from this ritual',
    },
  },
  {
    type: 'checklist' as const,
    data: {
      label: 'Follow-Up',
      items: [
        { id: 'fu-1', text: 'Journal reflections', checked: false },
        { id: 'fu-2', text: 'Dispose of offerings respectfully', checked: false },
        { id: 'fu-3', text: 'Clean up ritual space', checked: false },
        { id: 'fu-4', text: 'Save photos or voice notes', checked: false },
        { id: 'fu-5', text: 'Record tarot/oracle cards', checked: false },
        { id: 'fu-6', text: 'Watch for signs over the next few days', checked: false },
        { id: 'fu-7', text: 'Revisit this ritual later', checked: false },
      ],
    },
  },
]

type Props = {
  hub?: Hub
  userId: string
  initialCollectionId?: string
}

function slugify(val: string) {
  return val
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function HubForm({ hub, userId, initialCollectionId }: Props) {
  const { collections, setCollections, loading: collectionsLoading } = useCollections(userId)
  const [collectionId, setCollectionId] = useState<string | null>(hub?.collection_id ?? initialCollectionId ?? null)
  const [showNewCollection, setShowNewCollection] = useState(false)
  const [newCollectionTitle, setNewCollectionTitle] = useState('')
  const [creatingCollection, setCreatingCollection] = useState(false)
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
  const [privacyMode, setPrivacyMode] = useState<'public' | 'unlisted' | 'private'>(
    hub?.privacy_mode ?? 'public'
  )
  const [tags, setTags] = useState<string[]>(hub?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [error, setError] = useState('')
  const [slugError, setSlugError] = useState('')
  const [createdHubId, setCreatedHubId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  async function createCollection() {
    if (!newCollectionTitle.trim()) return
    setCreatingCollection(true)
    const { data, error } = await supabase
      .from('collections')
      .insert({ user_id: userId, title: newCollectionTitle.trim() })
      .select()
      .single()
    if (!error && data) {
      setCollections(prev => [data, ...prev])
      setCollectionId(data.id)
    }
    setNewCollectionTitle('')
    setShowNewCollection(false)
    setCreatingCollection(false)
  }

  function addTag(val: string) {
    const cleaned = val.trim().toLowerCase().replace(/^#/, '').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    if (cleaned && !tags.includes(cleaned)) setTags(prev => [...prev, cleaned])
    setTagInput('')
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) }
    else if (e.key === 'Backspace' && !tagInput && tags.length > 0) setTags(prev => prev.slice(0, -1))
  }

  function applyTemplate(t: Template) {
    setTitle(t.title)
    setSlug(slugify(t.title))
    setDescription(t.hubDescription)
    setThemeColor(t.themeColor)
    setSelectedTemplateId(t.id)
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
    setError('')
    setSlugError('')

    if (!slug) {
      setSlugError('Slug is required')
      return
    }

    startTransition(async () => {
      if (isEditing) {
        const { error: hubError } = await supabase
          .from('hubs')
          .update({
            title,
            slug,
            mode,
            redirect_url: mode === 'redirect' ? redirectUrl : null,
            description: mode === 'landing' ? description || null : null,
            image_url: mode === 'landing' ? imageUrl || null : null,
            theme_color: themeColor,
            collection_id: collectionId || null,
            privacy_mode: privacyMode,
            tags,
          })
          .eq('id', hub.id)

        if (hubError) {
          if (hubError.code === '23505') setSlugError('That slug is already taken')
          else setError(hubError.message)
          return
        }
      } else {
        const { data: newHub, error: hubError } = await supabase
          .from('hubs')
          .insert({
            user_id: userId,
            title,
            slug,
            mode,
            redirect_url: mode === 'redirect' ? redirectUrl : null,
            description: mode === 'landing' ? description || null : null,
            image_url: mode === 'landing' ? imageUrl || null : null,
            theme_color: themeColor,
            collection_id: collectionId || null,
            privacy_mode: privacyMode,
            tags,
          })
          .select()
          .single()

        if (hubError) {
          if (hubError.code === '23505') setSlugError('That slug is already taken')
          else setError(hubError.message)
          return
        }

        if (selectedTemplateId === 'ritual') {
          await Promise.all(
            RITUAL_BLOCKS.map((b, i) =>
              fetch(`/api/hub/${newHub.id}/content_blocks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: b.type, data: b.data, sort_order: i }),
              })
            )
          )
        }

        setCreatedHubId(newHub.id)
        return
      }

      router.push('/dashboard')
      router.refresh()
    })
  }

  if (createdHubId) {
    return (
      <div className="space-y-6">
        {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <p className="text-sm font-medium text-green-800">Hub created! Add content blocks below.</p>
        </div>
        <ContentBlocksEditor hubId={createdHubId} hubTitle={title} />
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          >
            Done
          </button>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/hub/${createdHubId}/edit`)}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Edit hub settings
          </button>
        </div>
      </div>
    )
  }

  // ── Edit mode: Content / Settings tabs ──────────────────────────────────
  if (isEditing) {
    return (
      <div>
        <div className="flex border-b border-gray-200 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'content'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Content
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Settings
          </button>
        </div>

        {activeTab === 'content' && (
          mode === 'landing' ? (
            <ContentBlocksEditor hubId={hub.id} hubTitle={hub.title} />
          ) : (
            <p className="text-sm text-gray-400 py-12 text-center">Content blocks are not available in redirect mode.</p>
          )
        )}

        {activeTab === 'settings' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Collection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collection</label>
              <div className="flex gap-2">
                <select
                  value={collectionId ?? ''}
                  onChange={e => setCollectionId(e.target.value || null)}
                  title="Collection"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={collectionsLoading}
                >
                  <option value="">No Collection</option>
                  {collections.map((c: Collection) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCollection(v => !v)}
                  className="text-sm text-blue-600 border border-blue-200 rounded-lg px-3 py-2 hover:bg-blue-50 transition-colors whitespace-nowrap"
                >
                  + New
                </button>
              </div>
              {showNewCollection && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newCollectionTitle}
                    onChange={e => setNewCollectionTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); createCollection() } }}
                    placeholder="Collection name"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={createCollection}
                    disabled={creatingCollection || !newCollectionTitle.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                  >
                    {creatingCollection ? '…' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowNewCollection(false); setNewCollectionTitle('') }}
                    className="text-sm text-gray-400 hover:text-gray-600 px-2"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

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
              <label className="block text-sm font-medium mb-1 text-gray-400">
                Slug <span className="text-xs font-normal text-amber-500">⚠ changing this breaks printed QR codes</span>
              </label>
              <div className="flex items-center border border-gray-200 bg-gray-50 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                <span className="px-3 py-2.5 bg-gray-100 text-gray-400 text-sm border-r border-gray-200 select-none">
                  /h/
                </span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={e => handleSlugChange(e.target.value)}
                  placeholder="our-home"
                  className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-transparent text-gray-400"
                />
              </div>
              {slugError && <p className="text-red-500 text-xs mt-1">{slugError}</p>}
            </div>

            {/* Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('landing')}
                  className={`border rounded-xl p-4 text-left transition-colors ${
                    mode === 'landing' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
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
                    mode === 'redirect' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`font-medium text-sm ${mode === 'redirect' ? 'text-amber-700' : 'text-gray-700'}`}>
                    Redirect
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Send visitors to a URL</div>
                </button>
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'public', label: 'Public', description: 'Anyone with the link' },
                  { value: 'unlisted', label: 'Unlisted', description: 'Not listed publicly' },
                  { value: 'private', label: 'Private', description: 'Only you can view' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPrivacyMode(opt.value)}
                    className={`border rounded-xl p-3 text-left transition-colors ${
                      privacyMode === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`font-medium text-xs ${privacyMode === opt.value ? 'text-blue-700' : 'text-gray-700'}`}>
                      {opt.label}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 leading-tight">{opt.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                    #{tag}
                    <button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))} className="text-gray-400 hover:text-gray-700 leading-none">×</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => { if (tagInput.trim()) addTag(tagInput) }}
                placeholder="Type a tag and press Enter — e.g. seasonal, car, kitchen"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add. Used for filtering in your dashboard.</p>
            </div>

            {/* Redirect URL */}
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

            {/* Landing page extras */}
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
                      title="Upload hub image"
                      onChange={async e => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setError('')
                          const url = await uploadPhoto(file, slug || 'temp', 0)
                          if (url) setImageUrl(url)
                          else setError('Image upload failed. Check console for details.')
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
              </>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
              >
                {isPending ? 'Saving…' : 'Save changes'}
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
        )}
      </div>
    )
  }

  // ── Create mode ─────────────────────────────────────────────────────────
  const tagPlaceholder = selectedTemplateId === 'ritual'
    ? 'Type a tag and press Enter — e.g. sabbat, full moon'
    : 'Type a tag and press Enter — e.g. seasonal, car, kitchen'
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Collection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Collection</label>
        <div className="flex gap-2">
          <select
            value={collectionId ?? ''}
            onChange={e => setCollectionId(e.target.value || null)}
            title="Collection"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={collectionsLoading}
          >
            <option value="">No Collection</option>
            {collections.map((c: Collection) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowNewCollection(v => !v)}
            className="text-sm text-blue-600 border border-blue-200 rounded-lg px-3 py-2 hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            + New
          </button>
        </div>
        {showNewCollection && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newCollectionTitle}
              onChange={e => setNewCollectionTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); createCollection() } }}
              placeholder="Collection name"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="button"
              onClick={createCollection}
              disabled={creatingCollection || !newCollectionTitle.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              {creatingCollection ? '…' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => { setShowNewCollection(false); setNewCollectionTitle('') }}
              className="text-sm text-gray-400 hover:text-gray-600 px-2"
            >
              ✕
            </button>
          </div>
        )}
      </div>

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
        <label className="block text-sm font-medium mb-1 text-gray-700">Slug</label>
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
          <span className="px-3 py-2.5 bg-gray-100 text-gray-400 text-sm border-r border-gray-200 select-none">
            /h/
          </span>
          <input
            type="text"
            required
            value={slug}
            onChange={e => handleSlugChange(e.target.value)}
            placeholder="our-home"
            className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-transparent text-gray-900"
          />
        </div>
        {slugError && <p className="text-red-500 text-xs mt-1">{slugError}</p>}
        {!slugError && (
          <p className="text-gray-400 text-xs mt-1">The permanent URL your QR code will always point to.</p>
        )}
      </div>

      {/* Mode */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode('landing')}
            className={`border rounded-xl p-4 text-left transition-colors ${
              mode === 'landing' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
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
              mode === 'redirect' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className={`font-medium text-sm ${mode === 'redirect' ? 'text-amber-700' : 'text-gray-700'}`}>
              Redirect
            </div>
            <div className="text-xs text-gray-400 mt-0.5">Send visitors to a URL</div>
          </button>
        </div>
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'public', label: 'Public', description: 'Anyone with the link' },
            { value: 'unlisted', label: 'Unlisted', description: 'Not listed publicly' },
            { value: 'private', label: 'Private', description: 'Only you can view' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPrivacyMode(opt.value)}
              className={`border rounded-xl p-3 text-left transition-colors ${
                privacyMode === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className={`font-medium text-xs ${privacyMode === opt.value ? 'text-blue-700' : 'text-gray-700'}`}>
                {opt.label}
              </div>
              <div className="text-xs text-gray-400 mt-0.5 leading-tight">{opt.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
              #{tag}
              <button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))} className="text-gray-400 hover:text-gray-700 leading-none">×</button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          onBlur={() => { if (tagInput.trim()) addTag(tagInput) }}
          placeholder={tagPlaceholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add. Used for filtering in your dashboard.</p>
      </div>

      {/* Redirect URL */}
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

      {/* Landing page extras */}
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
                title="Upload hub image"
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setError('')
                    const url = await uploadPhoto(file, slug || 'temp', 0)
                    if (url) setImageUrl(url)
                    else setError('Image upload failed. Check console for details.')
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
        </>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
        >
          {isPending ? 'Saving…' : 'Create hub'}
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
