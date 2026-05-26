"use client";
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import HubCard from '@/components/HubCard'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function EditFolderModal({ open, onClose, onSave, folder }: any) {
  const [title, setTitle] = useState(folder?.title || '')
  const [description, setDescription] = useState(folder?.description || '')
  useEffect(() => {
    setTitle(folder?.title || '')
    setDescription(folder?.description || '')
  }, [folder])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-xs">
        <h3 className="font-semibold text-lg mb-4">Edit Folder</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            title="Folder name"
            placeholder="Folder name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            title="Folder description"
            placeholder="Optional description"
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

function ConfirmFolderDeleteModal({ open, onClose, onDelete, onMove, folderTitle }: any) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-xs">
        <h3 className="font-semibold text-lg mb-2">Delete Folder</h3>
        <p className="text-gray-700 text-sm mb-4">
          What should happen to the hubs in <span className="font-bold">{folderTitle}</span>?
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
            onClick={onDelete}
          >
            Delete folder &amp; all hubs inside
          </button>
          <button
            type="button"
            className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
            onClick={onMove}
          >
            Keep hubs, remove from folder
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
  const [foldersOpen, setFoldersOpen] = useState(false)
  const [folderFilter, setFolderFilter] = useState<string | null>(null)
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

  function hubMatches(hub: any) {
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q ||
      hub.title.toLowerCase().includes(q) ||
      hub.slug.toLowerCase().includes(q) ||
      (hub.tags ?? []).some((t: string) => t.includes(q))
    const matchesMode = modeFilter === 'all' || hub.mode === modeFilter
    const matchesPrivacy = privacyFilter === 'all' || hub.privacy_mode === privacyFilter
    const matchesTag = !tagFilter || (hub.tags ?? []).includes(tagFilter)
    const matchesFolder = folderFilter === null || hub.collection_id === folderFilter
    return matchesSearch && matchesMode && matchesPrivacy && matchesTag && matchesFolder
  }

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const [{ data: hubsData }, { data: foldersData }, { data: profile }] = await Promise.all([
        supabase.from('hubs').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
        supabase.from('collections').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('username').eq('id', user.id).single(),
      ])

      setAllHubs(hubsData || [])
      setUsername((profile as any)?.username ?? '')

      let currentFolders = foldersData || []
      if (currentFolders.length === 0) {
        const { data: newFolder } = await supabase
          .from('collections').insert({ user_id: user.id, title: 'My Hubs' }).select().single()
        if (newFolder) currentFolders = [newFolder]
      }
      setFolders(currentFolders)
      setLoading(false)
    }
    fetchData()
  }, [router])

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

  const totalHubs = allHubs.length
  const totalFolders = folders.length
  const filteredHubs = allHubs.filter(hubMatches)
  const activeFolder = folderFilter ? folders.find((f: any) => f.id === folderFilter) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">QRMagNotes</h1>
          <div className="flex items-center gap-4">
            <Link href="/help" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
              Help
            </Link>
            <button
              type="button"
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                router.push('/login')
              }}
              className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Stats + primary CTA */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-400">
            {!loading && `${totalHubs} ${totalHubs === 1 ? 'hub' : 'hubs'} · ${totalFolders} ${totalFolders === 1 ? 'folder' : 'folders'}`}
          </p>
          <Link
            href="/dashboard/hub/new"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + New Hub
          </Link>
        </div>

        {/* Search & filter */}
        <div className="mb-4 space-y-2">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search hubs by title, slug, or tag…"
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
              <option value="landing">Landing Page</option>
              <option value="redirect">Redirect</option>
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

        {/* Folders section — compact rows, click to filter */}
        {!loading && (
          <div className="border border-gray-200 rounded-xl bg-white overflow-hidden mb-4">
            <button
              type="button"
              onClick={() => setFoldersOpen(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-700 text-sm">Folders ({totalFolders})</span>
              <span className="text-gray-400 text-xs">{foldersOpen ? '▲ Hide' : '▼ Show'}</span>
            </button>

            {foldersOpen && (
              <div className="border-t border-gray-100">
                {folders.map((folder: any) => {
                  const count = allHubs.filter(h => h.collection_id === folder.id).length
                  const isActive = folderFilter === folder.id
                  return (
                    <div key={folder.id} className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0">
                      <button
                        type="button"
                        onClick={() => setFolderFilter(isActive ? null : folder.id)}
                        className={`flex items-center gap-2 text-sm transition-colors ${isActive ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600'}`}
                      >
                        📁 {folder.title}
                        <span className="text-xs font-normal text-gray-400">
                          {count} {count === 1 ? 'hub' : 'hubs'}
                        </span>
                      </button>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/hub/new?collection=${folder.id}`}
                          className="text-xs text-blue-600 border border-blue-100 rounded px-2 py-1 hover:bg-blue-50 transition-colors"
                        >
                          + Hub
                        </Link>
                        <button
                          type="button"
                          className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-1 hover:bg-gray-100 transition-colors"
                          onClick={() => { setEditFolder(folder); setEditFolderOpen(true) }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-xs text-red-500 border border-red-200 rounded px-2 py-1 hover:bg-red-50 transition-colors"
                          onClick={() => { setConfirmFolder(folder); setConfirmFolderOpen(true) }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}

                {showCreateFolder ? (
                  <form onSubmit={handleCreateFolder} className="flex gap-2 px-5 py-4 border-t border-gray-100">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={newFolderTitle}
                        onChange={e => setNewFolderTitle(e.target.value)}
                        placeholder="Folder name"
                        autoFocus
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {folderError && <p className="text-red-500 text-xs mt-1">{folderError}</p>}
                    </div>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowCreateFolder(false); setNewFolderTitle(''); setFolderError('') }}
                      className="text-sm text-gray-400 hover:text-gray-600 px-2 py-2"
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  <div className="px-5 py-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowCreateFolder(true)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      + New Folder
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Folder filter banner */}
        {activeFolder && (
          <div className="flex items-center justify-between mb-4 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-lg">
            <span className="text-sm text-blue-700 font-medium">📁 {activeFolder.title}</span>
            <button
              type="button"
              onClick={() => setFolderFilter(null)}
              className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
            >
              Show all ×
            </button>
          </div>
        )}

        {/* Hub list */}
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading…</div>
        ) : allHubs.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Create your first hub</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              Choose a template to get started — or start blank and build as you go.
            </p>
            <Link
              href="/dashboard/hub/new"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              + New Hub
            </Link>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {filteredHubs.length > 0 ? (
              filteredHubs.map((hub: any) => (
                <HubCard
                  key={hub.id}
                  hub={hub}
                  username={username}
                  onTagClick={setTagFilter}
                  folders={folders}
                  onFolderChange={handleFolderChange}
                />
              ))
            ) : (
              <div className="text-center py-12 text-gray-400 text-sm">
                No hubs match your search.
              </div>
            )}
          </div>
        )}

      </main>

      <EditFolderModal
        open={editFolderOpen}
        folder={editFolder}
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

      <ConfirmFolderDeleteModal
        open={confirmFolderOpen}
        folderTitle={confirmFolder?.title}
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
