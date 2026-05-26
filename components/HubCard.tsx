'use client'

import Link from 'next/link'
import { Hub } from '@/lib/types'
import QRButton from './QRButton'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
}

const TEMPLATE_LABELS: Record<string, { emoji: string; label: string }> = {
  artwork:     { emoji: '🎨', label: 'Artwork Archive' },
  ritual:      { emoji: '🕯️', label: 'Ritual' },
  recipe:      { emoji: '🍳', label: 'Recipe' },
  box:         { emoji: '📦', label: "What's in the Box?" },
  plant:       { emoji: '🪴', label: 'Plant Profile' },
  maintenance: { emoji: '🔧', label: 'Home Maintenance' },
  travel:      { emoji: '✈️', label: 'Travel Journal' },
  pet:         { emoji: '🐾', label: 'Pet Profile' },
  book:        { emoji: '📖', label: 'Book Notes' },
  goal:        { emoji: '🎯', label: 'Goal Tracker' },
  journal:     { emoji: '📓', label: 'Journal' },
}

export default function HubCard({
  hub,
  username,
  onTagClick,
  folders,
  onFolderChange,
}: {
  hub: Hub
  username: string
  onTagClick?: (tag: string) => void
  folders?: { id: string; title: string }[]
  onFolderChange?: (hubId: string, folderId: string | null) => void
}) {
  const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/h/${username}/${hub.slug}`

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl)
    alert('Link copied to clipboard!')
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{hub.title}</h3>
          <p className="text-xs text-gray-400 font-mono mt-0.5">/h/{username}/{hub.slug}</p>
          <p className="text-xs text-gray-300 mt-1">
            Updated {formatDate(hub.updated_at)}
          </p>
          {folders !== undefined && (
            <select
              value={hub.collection_id ?? ''}
              onChange={e => onFolderChange?.(hub.id, e.target.value || null)}
              title="Folder"
              className="mt-1.5 text-xs text-gray-400 bg-transparent border-none cursor-pointer focus:outline-none hover:text-gray-600 -ml-0.5"
            >
              <option value="">📁 No folder</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>📁 {f.title}</option>
              ))}
            </select>
          )}
          {hub.tags && hub.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {hub.tags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagClick?.(tag)}
                  className="text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-500 px-2 py-0.5 rounded-full transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {hub.template_id && TEMPLATE_LABELS[hub.template_id] && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-stone-100 text-stone-500">
              {TEMPLATE_LABELS[hub.template_id].emoji} {TEMPLATE_LABELS[hub.template_id].label}
            </span>
          )}
          <span
            className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
              hub.mode === 'redirect'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {hub.mode === 'redirect' ? 'Redirect' : 'Landing Page'}
          </span>
          {hub.privacy_mode === 'private' && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700">
              Private
            </span>
          )}
          {hub.privacy_mode === 'unlisted' && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
              Unlisted
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/dashboard/hub/${hub.id}/edit`}
          className="text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          Edit
        </Link>
        <a
          href={`/h/${username}/${hub.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          View
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          Copy Link
        </button>
        <QRButton slug={hub.slug} username={username} />
        <Link
          href={`/dashboard/hub/${hub.id}/print`}
          className="text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          Print Card
        </Link>
      </div>
    </div>
  )
}
