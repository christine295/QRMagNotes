'use client'

import { useState } from 'react'

type Item = { id: string; text: string }

export default function ChecklistBlock({
  blockId,
  label,
  items,
  color,
}: {
  blockId: string
  label: string
  items: Item[]
  color: string
}) {
  const [checked, setChecked] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const saved = localStorage.getItem(`checklist-${blockId}`)
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })

  function toggle(id: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      try { localStorage.setItem(`checklist-${blockId}`, JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const allChecked = items.length > 0 && items.every(i => checked.has(i.id))

  function resetAll() {
    setChecked(new Set())
    try { localStorage.removeItem(`checklist-${blockId}`) } catch {}
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        {label && (
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>
            {label}
          </p>
        )}
        {allChecked && (
          <button
            type="button"
            onClick={resetAll}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Reset
          </button>
        )}
      </div>
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="flex items-center gap-3 w-full text-left group"
            >
              <span
                className="w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors"
                style={{
                  borderColor: checked.has(item.id) ? color : '#d1d5db',
                  backgroundColor: checked.has(item.id) ? color : 'transparent',
                }}
              >
                {checked.has(item.id) && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span className={`text-sm transition-colors ${checked.has(item.id) ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                {item.text}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
