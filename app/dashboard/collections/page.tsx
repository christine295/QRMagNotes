"use client";
import { redirect } from 'next/navigation'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/client'
import HubCard from '@/components/HubCard'
import { useState, useEffect } from 'react'
// Simple modal for confirmation
function ConfirmModal({ open, onClose, onDelete, onMove, collectionTitle }: any) {
  // Modal for editing a collection
  function EditCollectionModal({ open, onClose, onSave, collection }: any) {
    const [title, setTitle] = useState(collection?.title || "");
    const [description, setDescription] = useState(collection?.description || "");
    useEffect(() => {
      setTitle(collection?.title || "");
      setDescription(collection?.description || "");
    }, [collection]);
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-xs">
          <h3 className="font-semibold text-lg mb-2">Edit Collection</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
              onClick={() => onSave(title, description)}
            >
              Save
            </button>
            <button
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
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-xs">
        <h3 className="font-semibold text-lg mb-2">Delete Collection</h3>
        <p className="text-gray-700 text-sm mb-4">What should happen to the hubs in <span className="font-bold">{collectionTitle}</span>?</p>
        <div className="flex flex-col gap-2">
          <button
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
            onClick={onDelete}
          >
            Delete collection & all hubs
          </button>
          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
            onClick={onMove}
          >
            Move hubs to Uncategorized
          </button>
          <button
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


export default function CollectionsPage() {
  const [collections, setCollections] = useState<any[]>([])
  const [uncategorizedHubs, setUncategorizedHubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<{ [id: string]: boolean }>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmCollection, setConfirmCollection] = useState<any>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editCollection, setEditCollection] = useState<any>(null)

  // Fetch collections and uncategorized hubs on mount
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        redirect('/login')
        return
      }
      // Fetch collections with hubs
      const { data: collectionsData } = await supabase
        .from('collections')
        .select('*, hubs(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setCollections(collectionsData || [])

      // Fetch uncategorized hubs
      const { data: hubsData } = await supabase
        .from('hubs')
        .select('*')
        .eq('user_id', user.id)
        .is('collection_id', null)
        .order('created_at', { ascending: false })
      setUncategorizedHubs(hubsData || [])

      setLoading(false)
    }
    fetchData()
  }, [])

  async function handleCreateCollection(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title) {
      setError('Title is required')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      redirect('/login')
      return
    }
    const { data, error } = await supabase
      .from('collections')
      .insert([{ user_id: user.id, title, description }])
      .select()
      .single()
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setCollections([data, ...collections])
    setTitle('')
    setDescription('')
    setShowForm(false)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Collections</h1>
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center">
            <div className="text-2xl font-bold text-blue-700">{collections.reduce((acc, c) => acc + (c.hubs?.length || 0), 0) + uncategorizedHubs.length}</div>
            <div className="text-xs text-gray-500">Total Hubs</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center">
            <div className="text-2xl font-bold text-blue-700">{collections.length}</div>
            <div className="text-xs text-gray-500">Collections</div>
          </div>
        </div>

        <div className="mb-8 flex justify-end">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ Create Collection'}
          </button>
        </div>
        {showForm && (
          <form onSubmit={handleCreateCollection} className="bg-white border border-gray-200 rounded-xl p-5 mb-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              disabled={loading}
            >
              Create Collection
            </button>
          </form>
        )}
        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : (
          <>
            {/* Collections */}
            {collections && collections.length > 0 && (
              <div className="space-y-8 mb-12">
                {collections.map((collection: any) => {
                  const isOpen = expanded[collection.id] ?? true;
                  return (
                    <div key={collection.id} className="bg-white rounded-xl border border-gray-200 shadow p-5">
                      <div className="flex items-center gap-4 mb-2 justify-between">
                        <div className="flex items-center gap-4">
                          {collection.cover_image && (
                            <img src={collection.cover_image} alt="cover" className="w-12 h-12 rounded object-cover" />
                          )}
                          <div>
                            <h2 className="font-semibold text-lg text-gray-900">{collection.title}</h2>
                            {collection.description && <p className="text-gray-500 text-sm">{collection.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            className="text-xs text-blue-600 border border-blue-100 rounded px-2 py-1 hover:bg-blue-50 transition-colors"
                            onClick={() => setExpanded(e => ({ ...e, [collection.id]: !isOpen }))}
                          >
                            {isOpen ? 'Hide Hubs' : 'Show Hubs'}
                          </button>
                          <button
                            className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-1 hover:bg-gray-100 transition-colors"
                            onClick={() => { setEditCollection(collection); setEditOpen(true); }}
                          >
                            Edit
                          </button>
                                  {/* Edit Collection Modal */}
                                  <EditCollectionModal
                                    open={editOpen}
                                    collection={editCollection}
                                    onClose={() => setEditOpen(false)}
                                    onSave={async (title: string, description: string) => {
                                      if (!editCollection) return;
                                      setEditOpen(false);
                                      setLoading(true);
                                      const supabase = createClient();
                                      await supabase.from('collections').update({ title, description }).eq('id', editCollection.id);
                                      // Update local state
                                      setCollections(collections.map((c: any) => c.id === editCollection.id ? { ...c, title, description } : c));
                                      setEditCollection(null);
                                      setLoading(false);
                                    }}
                                  />
                          <button
                            className="text-xs text-red-500 border border-red-200 rounded px-2 py-1 hover:bg-red-50 transition-colors"
                            onClick={() => { setConfirmCollection(collection); setConfirmOpen(true); }}
                          >
                            Delete
                          </button>
                          {collection.hubs && collection.hubs.length > 0 && (
                            <Link
                              href={`/dashboard/hub/new?collection=${collection.id}`}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors ml-2"
                            >
                              + Add Hub
                            </Link>
                          )}
                        </div>
                              {/* Confirm Delete Modal */}
                              <ConfirmModal
                                open={confirmOpen}
                                collectionTitle={confirmCollection?.title}
                                onClose={() => setConfirmOpen(false)}
                                onDelete={async () => {
                                  // Delete all hubs in collection, then delete collection
                                  if (!confirmCollection) return;
                                  setConfirmOpen(false);
                                  setLoading(true);
                                  const supabase = createClient();
                                  // Delete hubs
                                  await supabase.from('hubs').delete().eq('collection_id', confirmCollection.id);
                                  // Delete collection
                                  await supabase.from('collections').delete().eq('id', confirmCollection.id);
                                  // Refresh
                                  setCollections(collections.filter((c: any) => c.id !== confirmCollection.id));
                                  setConfirmCollection(null);
                                  setLoading(false);
                                }}
                                onMove={async () => {
                                  // Move hubs to uncategorized, then delete collection
                                  if (!confirmCollection) return;
                                  setConfirmOpen(false);
                                  setLoading(true);
                                  const supabase = createClient();
                                  // Update hubs
                                  await supabase.from('hubs').update({ collection_id: null }).eq('collection_id', confirmCollection.id);
                                  // Delete collection
                                  await supabase.from('collections').delete().eq('id', confirmCollection.id);
                                  // Refresh
                                  setCollections(collections.filter((c: any) => c.id !== confirmCollection.id));
                                  // Also update uncategorizedHubs
                                  const { data: movedHubs } = await supabase.from('hubs').select('*').eq('collection_id', null);
                                  setUncategorizedHubs(movedHubs || []);
                                  setConfirmCollection(null);
                                  setLoading(false);
                                }}
                              />
                      </div>
                      {isOpen && (
                        <div className="mt-4 space-y-2">
                          {collection.hubs && collection.hubs.length > 0 ? (
                            collection.hubs.map((hub: any) => <HubCard key={hub.id} hub={hub} />)
                          ) : (
                            <div className="flex flex-col gap-2 items-start">
                              <div className="text-gray-400 text-sm">No hubs in this collection.</div>
                              <Link
                                href={`/dashboard/hub/new?collection=${collection.id}`}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                              >
                                + Add Hub
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Uncategorized Hubs */}
            {uncategorizedHubs && uncategorizedHubs.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow p-5 mb-12">
                <div className="flex items-center gap-4 mb-2 justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h2 className="font-semibold text-lg text-gray-900">Uncategorized</h2>
                      <p className="text-gray-500 text-sm">Hubs not assigned to any collection</p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/hub/new"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors ml-auto"
                  >
                    + Add Hub
                  </Link>
                </div>
                <div className="mt-4 space-y-2">
                  {uncategorizedHubs.map((hub: any) => <HubCard key={hub.id} hub={hub} />)}
                </div>
              </div>
            )}

            {/* Empty State */}
            {(!collections || collections.length === 0) && (!uncategorizedHubs || uncategorizedHubs.length === 0) && (
              <div className="text-center py-20 px-4">
                <div className="text-5xl mb-4">📁</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No collections or hubs yet</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                  Organize your hubs into collections for easier management.
                </p>
                <Link
                  href="/dashboard"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Back to Dashboard
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
