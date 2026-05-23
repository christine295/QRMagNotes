'use client'

import { HubLink } from '@/lib/types'

type LinkDraft = Omit<HubLink, 'id' | 'hub_id'> & { file?: File | null }

type Props = {
  links: LinkDraft[]
  onChange: (links: LinkDraft[]) => void
}

export default function LinkEditor({ links, onChange }: Props) {
  function addLink() {
    onChange([
      ...links,
      { label: '', url: '', type: 'link', sort_order: links.length, file: null }
    ])
  }

  function update(index: number, field: keyof LinkDraft, value: any) {
    onChange(links.map((l, i) => (i === index ? { ...l, [field]: value } : l)))
  }

  function remove(index: number) {
    onChange(
      links
        .filter((_, i) => i !== index)
        .map((l, i) => ({ ...l, sort_order: i }))
    )
  }

  function move(index: number, dir: -1 | 1) {
    const next = index + dir
    if (next < 0 || next >= links.length) return
    const updated = [...links]
    ;[updated[index], updated[next]] = [updated[next], updated[index]]
    onChange(updated.map((l, i) => ({ ...l, sort_order: i })))
  }

  return (
    <div className="space-y-2">
      {links.map((link, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => move(index, -1)}
              disabled={index === 0}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-20 text-[10px] leading-tight px-1"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              disabled={index === links.length - 1}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-20 text-[10px] leading-tight px-1"
            >
              ▼
            </button>
          </div>

          <div className="flex-1 grid grid-cols-3 gap-2">
            <select
              value={link.type}
              onChange={e => update(index, 'type', e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="link">Link</option>
              <option value="phone">Phone</option>
              <option value="note">Note</option>
              <option value="file">File (image/pdf)</option>
            </select>

            {link.type === 'link' && (
              <>
                <input
                  type="text"
                  placeholder="Label"
                  value={link.label}
                  onChange={e => update(index, 'label', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="url"
                  placeholder="URL"
                  value={link.url ?? ''}
                  onChange={e => update(index, 'url', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </>
            )}
            {link.type === 'phone' && (
              <>
                <input
                  type="text"
                  placeholder="Label"
                  value={link.label}
                  onChange={e => update(index, 'label', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={link.url ?? ''}
                  onChange={e => update(index, 'url', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </>
            )}
            {link.type === 'note' && (
              <>
                <input
                  type="text"
                  placeholder="Note title (optional)"
                  value={link.label}
                  onChange={e => update(index, 'label', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Note text"
                  value={link.url ?? ''}
                  onChange={e => update(index, 'url', e.target.value)}
                  rows={4}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
              </>
            )}
            {link.type === 'file' && (
              <>
                <input
                  type="text"
                  placeholder="Label (optional)"
                  value={link.label}
                  onChange={e => update(index, 'label', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e => update(index, 'file', e.target.files?.[0] || null)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => remove(index)}
            className="text-gray-300 hover:text-red-400 text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addLink}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
      >
        + Add link
      </button>
    </div>
  )
}
