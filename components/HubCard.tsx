'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Hub } from '@/lib/types'
import QRButton from './QRButton'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
}

const TEMPLATE_LABELS: Record<string, { emoji: string; label: string }> = {
  artwork:      { emoji: '🎨', label: 'Artwork Archive' },
  book:         { emoji: '📖', label: 'Book Notes' },
  diary:        { emoji: '📔', label: 'Diary / Life Log' },
  garden:       { emoji: '🌱', label: 'Garden Planner' },
  goal:         { emoji: '🎯', label: 'Goal Tracker' },
  grocery:      { emoji: '🛒', label: 'Grocery List' },
  hub_collector:{ emoji: '🔗', label: 'Hub Menu' },
  journal:      { emoji: '📓', label: 'Daily Reflection' },
  maintenance:  { emoji: '🔧', label: 'Home Maintenance' },
  packing:      { emoji: '🧳', label: 'Packing List' },
  pet:          { emoji: '🐾', label: 'Pet Profile' },
  plant:        { emoji: '🪴', label: 'Plant Profile' },
  recipe:       { emoji: '🍳', label: 'Recipe' },
  ritual:       { emoji: '🕯️', label: 'Ritual' },
  shadow_work:  { emoji: '🌑', label: 'Shadow Work' },
  travel:       { emoji: '✈️', label: 'Travel Journal' },
  vehicle:      { emoji: '🚗', label: 'Vehicle' },
  box:          { emoji: '📦', label: "What's in the Box?" },
  workout:      { emoji: '💪', label: 'Workout' },
}

export default function HubCard({
  hub,
  username,
  onTagClick,
  folders,
  onFolderChange,
  heartCount,
}: {
  hub: Hub
  username: string
  onTagClick?: (tag: string) => void
  folders?: { id: string; title: string }[]
  onFolderChange?: (hubId: string, folderId: string | null) => void
  heartCount?: number
}) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/h/${username}/${hub.slug}`

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl)
    setMenuOpen(false)
    alert('Link copied to clipboard!')
  }

  const hasTags = hub.tags && hub.tags.length > 0
  const currentCollection = folders?.find(f => f.id === hub.collection_id)

  return (
    <div
      onClick={() => router.push(`/dashboard/hub/${hub.id}/edit`)}
      className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3.5 cursor-pointer hover:shadow-md transition-all"
      style={{ borderLeft: `3px solid ${hub.theme_color ?? '#E5E7EB'}` }}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: info */}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 leading-snug">{hub.title}</h3>
          {hub.mode === 'redirect' && hub.redirect_url && (
            <p className="text-[11px] text-amber-500 leading-tight mt-0.5 truncate max-w-[180px]">
              » {hub.redirect_url}
            </p>
          )}
          <div className="mt-0.5">
            {currentCollection ? (
              <div className="flex gap-1.5 items-start">
                <span className="text-xs text-gray-400 shrink-0 leading-tight">📁</span>
                <div className="space-y-0.5">
                  <p className="text-xs text-gray-400 leading-tight">{currentCollection.title}</p>
                  <p className="text-[11px] text-gray-300 font-mono leading-tight">
                    /h/{username}/{hub.slug}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-gray-300 font-mono leading-tight">
                /h/{username}/{hub.slug}
              </p>
            )}
          </div>
        </div>

        {/* Right: badges + kebab */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div ref={menuRef} className="relative mb-0.5">
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
              aria-label="Actions"
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md px-2 py-0.5 transition-colors text-lg leading-none"
            >
              ⋮
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                <Link
                  href={`/dashboard/hub/${hub.id}/edit`}
                  onClick={e => { e.stopPropagation(); setMenuOpen(false) }}
                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Edit
                </Link>
                <a
                  href={`/h/${username}/${hub.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => { e.stopPropagation(); setMenuOpen(false) }}
                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  View
                </a>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); copyLink() }}
                  className="w-full text-left flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Copy link
                </button>
                <QRButton
                  slug={hub.slug}
                  username={username}
                  className="w-full text-left flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onComplete={() => setMenuOpen(false)}
                />
                <Link
                  href={`/dashboard/hub/${hub.id}/print`}
                  onClick={e => { e.stopPropagation(); setMenuOpen(false) }}
                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Print card
                </Link>
                {folders !== undefined && (
                  <div
                    onClick={e => e.stopPropagation()}
                    className="px-4 py-2.5 border-t border-gray-100"
                  >
                    <p className="text-xs text-gray-400 mb-1.5">Move to Collection</p>
                    <select
                      value={hub.collection_id ?? ''}
                      onChange={e => { onFolderChange?.(hub.id, e.target.value || null); setMenuOpen(false) }}
                      title="Move to Collection"
                      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    >
                      <option value="">No Collection</option>
                      {folders.map(f => (
                        <option key={f.id} value={f.id}>{f.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {hub.template_id && TEMPLATE_LABELS[hub.template_id] && (
            <span className="text-[11px] font-normal px-1.5 py-px rounded-full bg-stone-50 text-stone-400">
              {TEMPLATE_LABELS[hub.template_id].emoji} {TEMPLATE_LABELS[hub.template_id].label}
            </span>
          )}
          <span
            className={`shrink-0 text-[11px] font-normal px-1.5 py-px rounded-full ${
              hub.mode === 'redirect'
                ? 'bg-amber-50 text-amber-600'
                : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {hub.mode === 'redirect' ? 'Redirect Link' : 'Interactive Page'}
          </span>
          {hub.privacy_mode === 'private' && (
            <span className="text-[11px] font-normal px-1.5 py-px rounded-full bg-stone-100 text-stone-500">
              Private
            </span>
          )}
          {hub.privacy_mode === 'unlisted' && (
            <span className="text-[11px] font-normal px-1.5 py-px rounded-full bg-stone-50 text-stone-400">
              Unlisted
            </span>
          )}
        </div>
      </div>

      {/* Bottom row: tags left, date right */}
      <div className="flex items-end justify-between gap-2 mt-2 pt-2 border-t border-gray-100">
        <div className="flex flex-wrap gap-0.5">
          {hasTags && hub.tags.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={e => { e.stopPropagation(); onTagClick?.(tag) }}
              className="text-[11px] bg-stone-50 hover:bg-stone-100 hover:text-stone-600 text-stone-400 px-1.5 py-px rounded-full transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {(heartCount != null && heartCount > 0 || (hub.save_count ?? 0) > 0) && (
            <span className="flex items-center gap-1.5 text-[10px] text-gray-300">
              {heartCount != null && heartCount > 0 && (
                <span className="flex items-center gap-0.5 text-rose-400">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                  {heartCount}
                </span>
              )}
              {(hub.save_count ?? 0) > 0 && (
                <span className="flex items-center gap-0.5 text-blue-300">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                  </svg>
                  {hub.save_count}
                </span>
              )}
            </span>
          )}
          <p className="text-[10px] text-gray-300 whitespace-nowrap">
            {formatDate(hub.updated_at)}
          </p>
        </div>
      </div>
    </div>
  )
}
