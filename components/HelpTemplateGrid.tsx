'use client'

import { useState } from 'react'
import Link from 'next/link'

type Block = { label: string; type: string; note?: string }
export type HelpTemplate = {
  name: string
  templateId: string
  emoji: string
  tagline: string
  description: string
  borderClass: string
  blocks: Block[]
}

export default function HelpTemplateGrid({
  templates,
  isLoggedIn,
}: {
  templates: HelpTemplate[]
  isLoggedIn: boolean
}) {
  const [active, setActive] = useState<HelpTemplate | null>(null)

  function createHubUrl(templateId: string) {
    return isLoggedIn
      ? `/dashboard/hub/new?template=${templateId}`
      : `/login?next=/dashboard/hub/new?template=${templateId}`
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        {templates.map(t => (
          <div
            key={t.name}
            className={`bg-white rounded-xl border border-stone-100 border-l-[3px] ${t.borderClass} p-4 flex flex-col`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl leading-none">{t.emoji}</span>
              <span className="text-sm font-semibold text-stone-800 leading-snug">{t.name}</span>
            </div>
            <p className="text-xs text-stone-500 leading-[1.55]">{t.tagline}</p>
            {t.blocks.length > 0 && (
              <p className="text-[10px] text-stone-400 mt-2">{t.blocks.length} blocks</p>
            )}
            <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
              <Link
                href={createHubUrl(t.templateId)}
                className="text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Create this Hub »
              </Link>
              {t.blocks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActive(t)}
                  className="text-[11px] text-stone-400 hover:text-stone-600 transition-colors"
                >
                  See blocks
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={active.name}
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setActive(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className={`flex items-center gap-3 px-5 py-4 border-b border-stone-100 border-l-[4px] rounded-tl-2xl ${active.borderClass}`}>
              <span className="text-2xl leading-none">{active.emoji}</span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-stone-800">{active.name}</h2>
                <p className="text-xs text-stone-500 mt-0.5 leading-snug">{active.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="text-stone-300 hover:text-stone-600 text-2xl leading-none flex-shrink-0 transition-colors"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-stone-100 px-5">
              {active.blocks.map(b => (
                <div key={b.label} className="py-2.5 flex gap-3 items-baseline">
                  <span className="text-xs font-medium text-stone-600 w-40 flex-shrink-0">{b.label}</span>
                  <span className="text-[10px] text-stone-400 w-16 flex-shrink-0">{b.type}</span>
                  {b.note && <span className="text-[10px] text-stone-400 leading-[1.5]">{b.note}</span>}
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[11px] text-stone-400">{active.blocks.length} blocks included</span>
              <Link
                href={createHubUrl(active.templateId)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Create this Hub »
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
