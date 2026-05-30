"use client";
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import HubCard from '@/components/HubCard'
import SavedHubCard from '@/components/SavedHubCard'
import SiteFooter from '@/components/SiteFooter'
import WelcomeCard from '@/components/WelcomeCard'
import FeedbackModal from '@/components/FeedbackModal'
import { VERSION } from '@/lib/version'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

function EditCollectionModal({ open, onClose, onSave, collection }: any) {
  const [title, setTitle] = useState(collection?.title || '')
  const [description, setDescription] = useState(collection?.description || '')
  useEffect(() => {
    setTitle(collection?.title || '')
    setDescription(collection?.description || '')
  }, [collection])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-xs">
        <h3 className="font-semibold text-lg mb-4">Edit Collection</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            title="Collection name"
            placeholder="Collection name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            title="Collection description"
            placeholder="e.g. Rituals, tarot, moon work, and seasonal reflections"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
            onClick={() => onSave(title, description)}
          >
            Save
          </button>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 text-xs underline"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmCollectionDeleteModal({ open, onClose, onDelete, onMove, collectionTitle }: any) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-xs">
        <h3 className="font-semibold text-lg mb-2">Delete Collection</h3>
        <p className="text-gray-700 text-sm mb-4">
          What should happen to the Hubs in <span className="font-bold">{collectionTitle}</span>?
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
            onClick={onDelete}
          >
            Delete Collection &amp; all Hubs inside
          </button>
          <button
            type="button"
            className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
            onClick={onMove}
          >
            Keep Hubs, remove from Collection
          </button>
          <button
            type="button"
            className="mt-2 text-gray-500 hover:text-gray-700 text-xs underline"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [allHubs, setAllHubs] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [username, setUsername] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [savedHubs, setSavedHubs] = useState<any[]>([])
  const [heartCounts, setHeartCounts] = useState<Record<string, number>>({})
  const [folderFilter, setFolderFilter] = useState<string | null>(null)
  const [openCollectionMenu, setOpenCollectionMenu] = useState<string | null>(null)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderTitle, setNewFolderTitle] = useState('')
  const [folderError, setFolderError] = useState('')
  const [editFolderOpen, setEditFolderOpen] = useState(false)
  const [editFolder, setEditFolder] = useState<any>(null)
  const [confirmFolderOpen, setConfirmFolderOpen] = useState(false)
  const [confirmFolder, setConfirmFolder] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [modeFilter, setModeFilter] = useState<'all' | 'landing' | 'redirect'>('all')
  const [privacyFilter, setPrivacyFilter] = useState<'all' | 'public' | 'unlisted' | 'private'>('all')
  const [tagFilter, setTagFilter] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [hamburgerOpen, setHamburgerOpen] = useState(false)

  function hubMatches(hub: any) {
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q ||
      hub.title.toLowerCase().includes(q) ||
      hub.slug.toLowerCase().includes(q) ||
      (hub.tags ?? []).some((t: string) => t.includes(q))
    const matchesMode = modeFilter === 'all' || hub.mode === modeFilter
    const matchesPrivacy = privacyFilter === 'all' || hub.privacy_mode === privacyFilter
    const matchesTag = !tagFilter || (hub.tags ?? []).includes(tagFilter)
    const matchesFolder = folderFilter === null ||
      (folderFilter === '__none__' ? hub.collection_id === null : hub.collection_id === folderFilter)
    return matchesSearch && matchesMode && matchesPrivacy && matchesTag && matchesFolder
  }

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setUserEmail(user.email ?? '')

      const [{ data: hubsData }, { data: foldersData }, { data: profile }, { data: savedData }] = await Promise.all([
        supabase.from('hubs').select('*').eq('user_id', user.id).order('title', { ascending: true }),
        supabase.from('collections').select('*').eq('user_id', user.id).order('title', { ascending: true }),
        supabase.from('profiles').select('username, username_confirmed').eq('id', user.id).single(),
        supabase.from('saved_hubs')
          .select('id, hub_id, collection_id, last_viewed_at, created_at, hubs(id, title, slug, theme_color, template_id, updated_at, privacy_mode, user_id)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ])

      if (!(profile as any)?.username_confirmed) {
        router.replace('/setup')
        return
      }

      const ownedHubs = hubsData || []
      setAllHubs(ownedHubs)
      setUsername((profile as any)?.username ?? '')

      let currentFolders = foldersData || []
      if (currentFolders.length === 0) {
        const { data: newFolder } = await supabase
          .from('collections').insert({ user_id: user.id, title: 'My Hubs' }).select().single()
        if (newFolder) currentFolders = [newFolder]
      }
      setFolders(currentFolders)

      // Process saved hubs — fetch owner usernames
      const validSaved = (savedData ?? []).filter((s: any) => s.hubs && s.hubs.privacy_mode !== 'private')
      const ownerIds = [...new Set(validSaved.map((s: any) => s.hubs?.user_id).filter(Boolean))] as string[]
      const { data: ownerProfiles } = ownerIds.length > 0
        ? await supabase.from('profiles').select('id, username').in('id', ownerIds)
        : { data: [] }
      const usernameMap: Record<string, string> = {}
      ;(ownerProfiles ?? []).forEach((p: any) => { usernameMap[p.id] = p.username })
      setSavedHubs(validSaved.map((s: any) => ({
        ...s,
        hub: s.hubs,
        owner_username: usernameMap[s.hubs.user_id] ?? '',
      })))

      // Heart counts for owned hubs
      const ownedIds = ownedHubs.map((h: any) => h.id)
      const { data: heartRows } = ownedIds.length > 0
        ? await supabase.from('hub_hearts').select('hub_id').in('hub_id', ownedIds)
        : { data: [] }
      const counts: Record<string, number> = {}
      ;(heartRows ?? []).forEach((h: any) => { counts[h.hub_id] = (counts[h.hub_id] ?? 0) + 1 })
      setHeartCounts(counts)

      setLoading(false)
    }
    fetchData()
  }, [router])

  useEffect(() => {
    if (!settingsOpen) return
    function handleClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [settingsOpen])

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault()
    setFolderError('')
    if (!newFolderTitle.trim()) { setFolderError('Name is required'); return }
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('collections').insert([{ user_id: user.id, title: newFolderTitle.trim() }]).select().single()
    if (error) { setFolderError(error.message); return }
    setFolders(prev => [data, ...prev])
    setNewFolderTitle('')
    setShowCreateFolder(false)
  }

  async function handleFolderChange(hubId: string, folderId: string | null) {
    const supabase = createClient()
    await supabase.from('hubs').update({ collection_id: folderId }).eq('id', hubId)
    setAllHubs(prev => prev.map(h => h.id === hubId ? { ...h, collection_id: folderId } : h))
  }

  async function handleSavedHubUnsave(hubId: string) {
    const res = await fetch(`/api/hub/${hubId}/save`, { method: 'DELETE' })
    if (res.ok) setSavedHubs(prev => prev.filter(s => s.hub_id !== hubId))
  }

  async function handleSavedHubCollectionChange(hubId: string, collectionId: string | null) {
    const res = await fetch(`/api/hub/${hubId}/save`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection_id: collectionId }),
    })
    if (res.ok) {
      setSavedHubs(prev => prev.map(s => s.hub_id === hubId ? { ...s, collection_id: collectionId } : s))
    }
  }

  const totalHubs = allHubs.length
  const totalFolders = folders.length
  const uncollectedCount = allHubs.filter(h => h.collection_id === null).length
  const filteredHubs = allHubs.filter(hubMatches)
  const activeCollection = (folderFilter && folderFilter !== '__none__')
    ? folders.find((f: any) => f.id === folderFilter)
    : null
  const totalSaved = savedHubs.length

  // Filter saved hubs to match the active collection filter
  const filteredSavedHubs = savedHubs.filter(s => {
    if (folderFilter === null) return true
    if (folderFilter === '__none__') return s.collection_id === null
    return s.collection_id === folderFilter
  })

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            HubCollector™
            <span className="ml-2 text-xs font-normal text-gray-400 hidden sm:inline">{VERSION}</span>
          </h1>
          <div className="flex items-center gap-2">
            {/* Desktop nav */}
            <Link href="/explore" className="hidden sm:inline-flex text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
              Explore
            </Link>
            {username && (
              <Link href={`/h/${username}`} className="hidden sm:inline-flex text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                Profile
              </Link>
            )}
            <Link href="/help" className="hidden sm:inline-flex text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
              Help
            </Link>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setHamburgerOpen(v => !v)}
              aria-label="Menu"
              className={`sm:hidden rounded-lg p-1.5 transition-colors ${hamburgerOpen ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            >
              {hamburgerOpen ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
              )}
            </button>
            <div ref={settingsRef} className="relative">
              <button
                type="button"
                onClick={() => setSettingsOpen(v => !v)}
                aria-label="Settings"
                className={`rounded-lg p-1.5 transition-colors ${settingsOpen ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </button>
              {settingsOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1 overflow-hidden">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-400">Account</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSettingsOpen(false); router.push(`/h/${username}`) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    View Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSettingsOpen(false); router.push('/settings/profile') }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Edit Profile
                  </button>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => { setSettingsOpen(false); setFeedbackOpen(true) }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Send feedback
                    </button>
                    {userEmail === 'christine@websketching.com' && (
                      <button
                        type="button"
                        onClick={() => { setSettingsOpen(false); router.push('/admin') }}
                        className="w-full text-left px-4 py-2.5 text-sm text-violet-600 hover:bg-violet-50 transition-colors"
                      >
                        Admin
                      </button>
                    )}
                  </div>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        setSettingsOpen(false)
                        const supabase = createClient()
                        await supabase.auth.signOut()
                        router.push('/login')
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile nav menu */}
      {hamburgerOpen && (
        <div className="sm:hidden bg-white border-b border-gray-100 shadow-sm z-20">
          <Link href="/explore" onClick={() => setHamburgerOpen(false)}
            className="flex items-center justify-between px-6 py-4 text-base font-medium text-gray-700 hover:bg-gray-50 border-b border-gray-50 transition-colors">
            Explore
            <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </Link>
          {username && (
            <Link href={`/h/${username}`} onClick={() => setHamburgerOpen(false)}
              className="flex items-center justify-between px-6 py-4 text-base font-medium text-gray-700 hover:bg-gray-50 border-b border-gray-50 transition-colors">
              Profile
              <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </Link>
          )}
          <Link href="/help" onClick={() => setHamburgerOpen(false)}
            className="flex items-center justify-between px-6 py-4 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Help
            <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </Link>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Stats + primary CTA */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-400">
            {!loading && [
              `${totalHubs} ${totalHubs === 1 ? 'Hub' : 'Hubs'}`,
              `${totalFolders} ${totalFolders === 1 ? 'Collection' : 'Collections'}`,
              totalSaved > 0 ? `${totalSaved} Saved` : null,
            ].filter(Boolean).join(' · ')}
          </p>
          <Link
            href="/dashboard/hub/new"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + New Hub
          </Link>
        </div>

        {/* Welcome / suggestion card */}
        {!loading && (
          <WelcomeCard
            hubCount={totalHubs}
            collectionCount={totalFolders}
            allHubs={allHubs}
            onCreateCollection={() => setShowCreateFolder(true)}
          />
        )}

        {/* Collections */}
        {!loading && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-600 flex items-center gap-1.5">
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0">
                  <path d="M.5 3a.5.5 0 00-.5.5v9a.5.5 0 00.5.5h15a.5.5 0 00.5-.5V5a.5.5 0 00-.5-.5H7.207L5.854 3.146A.5.5 0 005.5 3H.5z"/>
                </svg>
                Collections
                <span className="text-xs font-normal text-gray-400">({totalFolders})</span>
              </h2>
              {(activeCollection || folderFilter === '__none__') && (
                <button
                  type="button"
                  onClick={() => setFolderFilter(null)}
                  className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                >
                  Show all Hubs ×
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              {folders.map((folder: any) => {
                const count = allHubs.filter(h => h.collection_id === folder.id).length
                const isActive = folderFilter === folder.id
                const menuOpen = openCollectionMenu === folder.id

                return (
                  <div
                    key={folder.id}
                    onClick={() => { setFolderFilter(isActive ? null : folder.id); setOpenCollectionMenu(null) }}
                    className={`group rounded-xl border px-4 py-3 cursor-pointer transition-all ${
                      isActive
                        ? 'border-blue-200 bg-blue-50/60 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-sm font-medium truncate ${isActive ? 'text-blue-800' : 'text-gray-800'}`}>
                          {folder.title}
                        </span>
                        {count === 0 ? (
                          <span className="text-xs text-gray-300 shrink-0 italic">empty</span>
                        ) : (
                          <span className={`text-xs shrink-0 ${isActive ? 'text-blue-400' : 'text-gray-400'}`}>
                            {count} {count === 1 ? 'Hub' : 'Hubs'}
                          </span>
                        )}
                      </div>

                      <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setOpenCollectionMenu(menuOpen ? null : folder.id)}
                          className={`text-base leading-none rounded-md px-1.5 py-0.5 transition-colors ${
                            isActive
                              ? 'text-blue-400 hover:text-blue-600 hover:bg-blue-100'
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          ⋮
                        </button>
                        {menuOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenCollectionMenu(null)} />
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                              <Link
                                href={`/dashboard/hub/new?collection=${folder.id}`}
                                onClick={() => setOpenCollectionMenu(null)}
                                className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                + Add Hub
                              </Link>
                              <button
                                type="button"
                                onClick={() => { setEditFolder(folder); setEditFolderOpen(true); setOpenCollectionMenu(null) }}
                                className="w-full text-left flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => { setConfirmFolder(folder); setConfirmFolderOpen(true); setOpenCollectionMenu(null) }}
                                className="w-full text-left flex items-center px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Description — only visible when collection is selected */}
                    {isActive && folder.description && (
                      <p className="text-xs text-blue-600/60 mt-1.5 leading-relaxed pr-6">
                        {folder.description}
                      </p>
                    )}
                  </div>
                )
              })}

              {/* Uncollected hubs */}
              {uncollectedCount > 0 && (() => {
                const isActive = folderFilter === '__none__'
                return (
                  <div
                    onClick={() => { setFolderFilter(isActive ? null : '__none__'); setOpenCollectionMenu(null) }}
                    className={`rounded-xl border px-4 py-3 cursor-pointer transition-all ${
                      isActive
                        ? 'border-blue-200 bg-blue-50/60 shadow-sm'
                        : 'border-dashed border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${isActive ? 'text-blue-800' : 'text-gray-500'}`}>
                        Uncollected
                      </span>
                      <span className={`text-xs ${isActive ? 'text-blue-400' : 'text-gray-400'}`}>
                        {uncollectedCount} {uncollectedCount === 1 ? 'Hub' : 'Hubs'}
                      </span>
                    </div>
                  </div>
                )
              })()}

              {/* New collection */}
              {showCreateFolder ? (
                <form
                  onSubmit={handleCreateFolder}
                  className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3"
                >
                  <input
                    type="text"
                    value={newFolderTitle}
                    onChange={e => setNewFolderTitle(e.target.value)}
                    placeholder="Collection name"
                    autoFocus
                    className="w-full text-sm outline-none bg-transparent placeholder:text-gray-400"
                  />
                  {folderError && <p className="text-red-500 text-xs mt-1">{folderError}</p>}
                  <div className="flex gap-2 mt-2.5">
                    <button
                      type="submit"
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowCreateFolder(false); setNewFolderTitle(''); setFolderError('') }}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCreateFolder(true)}
                  className="w-full rounded-xl border border-dashed border-gray-200 px-4 py-2.5 text-sm text-gray-400 hover:text-gray-500 hover:border-gray-300 transition-colors text-left"
                >
                  + New Collection
                </button>
              )}
            </div>
          </div>
        )}

        {/* Search & filter */}
        {!loading && allHubs.length > 0 && (
          <div className="mb-4 space-y-2">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Hubs by title, slug, or tag…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {tagFilter && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Filtering by tag:</span>
                <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                  #{tagFilter}
                  <button type="button" onClick={() => setTagFilter('')} className="hover:text-blue-900 leading-none">×</button>
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <select
                value={modeFilter}
                onChange={e => setModeFilter(e.target.value as any)}
                title="Filter by mode"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
              >
                <option value="all">All modes</option>
                <option value="landing">Interactive Pages</option>
                <option value="redirect">Redirect Links</option>
              </select>
              <select
                value={privacyFilter}
                onChange={e => setPrivacyFilter(e.target.value as any)}
                title="Filter by visibility"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
              >
                <option value="all">All visibility</option>
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
        )}

        {/* Hub list */}
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading…</div>
        ) : allHubs.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Create a Hub for anything</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              Attach a QR code to anything you want to remember, organize, or share — and update the content anytime.
            </p>
            <Link
              href="/dashboard/hub/new"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              + New Hub
            </Link>
          </div>
        ) : (
          <>
            {/* Hubs section label — only shown when there are multiple hubs or a filter is active */}
            {(totalHubs > 1 || activeCollection || folderFilter) && (
              <div className="mb-2">
                <h2 className="text-sm font-semibold text-gray-600 flex items-center gap-1.5">
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0">
                    <path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zm8 0A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7h-3A1.5 1.5 0 019 5.5v-3zm-8 8A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zm8 0A1.5 1.5 0 0110.5 9h3a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 019 13.5v-3z"/>
                  </svg>
                  {activeCollection ? activeCollection.title : folderFilter === '__none__' ? 'Uncollected' : 'All Hubs'}
                  {filteredHubs.length > 0 && (
                    <span className="text-xs font-normal text-gray-400 ml-0.5">({filteredHubs.length})</span>
                  )}
                </h2>
              </div>
            )}

            <div className="space-y-2 mb-8">
              {filteredHubs.length > 0 ? (
                filteredHubs.map((hub: any) => (
                  <HubCard
                    key={hub.id}
                    hub={hub}
                    username={username}
                    onTagClick={setTagFilter}
                    folders={folders}
                    onFolderChange={handleFolderChange}
                    heartCount={heartCounts[hub.id]}
                  />
                ))
              ) : (
                <div className="text-center py-12 text-gray-400 text-sm">
                  No Hubs match your search.
                </div>
              )}
            </div>
          </>
        )}

        {/* Saved Hubs section */}
        {!loading && totalSaved > 0 && (
          <div className="mt-8">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-gray-600 flex items-center gap-1.5">
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0">
                  <path d="M2 2a2 2 0 012-2h8a2 2 0 012 2v13.5a.5.5 0 01-.777.416L8 13.101l-5.223 2.815A.5.5 0 012 15.5V2zm2-1a1 1 0 00-1 1v12.566l4.723-2.482a.5.5 0 01.554 0L13 14.566V2a1 1 0 00-1-1H4z"/>
                </svg>
                Saved Hubs
                <span className="text-xs font-normal text-gray-400">
                  ({filteredSavedHubs.length}{filteredSavedHubs.length !== totalSaved ? ` of ${totalSaved}` : ''})
                </span>
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5 ml-5">Hubs saved from other people</p>
            </div>
            {filteredSavedHubs.length > 0 ? (
              <div className="space-y-2">
                {filteredSavedHubs.map(savedHub => (
                  <SavedHubCard
                    key={savedHub.id}
                    savedHub={savedHub}
                    folders={folders}
                    onUnsave={handleSavedHubUnsave}
                    onCollectionChange={handleSavedHubCollectionChange}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                No saved Hubs in this Collection.
              </div>
            )}
          </div>
        )}

      </main>

      <SiteFooter />

      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}

      <EditCollectionModal
        open={editFolderOpen}
        collection={editFolder}
        onClose={() => { setEditFolderOpen(false); setEditFolder(null) }}
        onSave={async (title: string, description: string) => {
          if (!editFolder) return
          setEditFolderOpen(false)
          const supabase = createClient()
          await supabase.from('collections').update({ title, description }).eq('id', editFolder.id)
          setFolders(prev => prev.map((f: any) => f.id === editFolder.id ? { ...f, title, description } : f))
          setEditFolder(null)
        }}
      />

      <ConfirmCollectionDeleteModal
        open={confirmFolderOpen}
        collectionTitle={confirmFolder?.title}
        onClose={() => { setConfirmFolderOpen(false); setConfirmFolder(null) }}
        onDelete={async () => {
          if (!confirmFolder) return
          setConfirmFolderOpen(false)
          const supabase = createClient()
          const hubIds = allHubs.filter(h => h.collection_id === confirmFolder.id).map(h => h.id)
          if (hubIds.length > 0) await supabase.from('hubs').delete().in('id', hubIds)
          await supabase.from('collections').delete().eq('id', confirmFolder.id)
          setFolders(prev => prev.filter((f: any) => f.id !== confirmFolder.id))
          setAllHubs(prev => prev.filter(h => !hubIds.includes(h.id)))
          if (folderFilter === confirmFolder.id) setFolderFilter(null)
          setConfirmFolder(null)
        }}
        onMove={async () => {
          if (!confirmFolder) return
          setConfirmFolderOpen(false)
          const supabase = createClient()
          await supabase.from('hubs').update({ collection_id: null }).eq('collection_id', confirmFolder.id)
          await supabase.from('collections').delete().eq('id', confirmFolder.id)
          setFolders(prev => prev.filter((f: any) => f.id !== confirmFolder.id))
          setAllHubs(prev => prev.map(h =>
            h.collection_id === confirmFolder.id ? { ...h, collection_id: null } : h
          ))
          if (folderFilter === confirmFolder.id) setFolderFilter(null)
          setConfirmFolder(null)
        }}
      />
    </div>
  )
}
