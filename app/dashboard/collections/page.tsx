"use client";
import { redirect } from 'next/navigation'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/client'
import HubCard from '@/components/HubCard'
import { useState, useEffect } from 'react'

export default function CollectionsPage() {
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  // Fetch collections on mount
  useEffect(() => {
    async function fetchCollections() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        redirect('/login')
        return
      }
      const { data } = await supabase
        .from('collections')
        .select('*, hubs(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setCollections(data || [])
      setLoading(false)
    }
    fetchCollections()
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
        ) : collections && collections.length > 0 ? (
          <div className="space-y-8">
            {collections.map((collection: any) => (
              <div key={collection.id} className="bg-white rounded-xl border border-gray-200 shadow p-5">
                <div className="flex items-center gap-4 mb-2">
                  {collection.cover_image && (
                    <img src={collection.cover_image} alt="cover" className="w-12 h-12 rounded object-cover" />
                  )}
                  <div>
                    <h2 className="font-semibold text-lg text-gray-900">{collection.title}</h2>
                    {collection.description && <p className="text-gray-500 text-sm">{collection.description}</p>}
                  </div>
                </div>
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
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 px-4">
            <div className="text-5xl mb-4">📁</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No collections yet</h3>
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
      </main>
    </div>
  )
}
