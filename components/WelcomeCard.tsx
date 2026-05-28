'use client'

import Link from 'next/link'
import { useState } from 'react'

const LABEL_STYLES: Record<string, string> = {
  'Welcome':             'bg-teal-50 text-teal-700 border border-teal-200',
  'Next best step':      'bg-blue-50 text-blue-700 border border-blue-200',
  'Make this useful':    'bg-amber-50 text-amber-700 border border-amber-200',
  'Your HubCollector tip': 'bg-stone-100 text-stone-500 border border-stone-200',
  'Try this next':       'bg-green-50 text-green-700 border border-green-200',
}

type CardState = {
  label: string
  title: string
  body: string
  primaryButton?: { text: string; href?: string; onClick?: () => void }
  secondaryButton?: { text: string; href: string }
  footerLink?: { text: string; href: string }
  isFounder?: boolean
}

function getCardState({
  hubCount,
  collectionCount,
  allHubsPrivate,
  hasHubCollector,
  hasQuickAccessHub,
  firstHubId,
  onCreateCollection,
}: {
  hubCount: number
  collectionCount: number
  allHubsPrivate: boolean
  hasHubCollector: boolean
  hasQuickAccessHub: boolean
  firstHubId?: string
  onCreateCollection?: () => void
}): CardState | null {

  if (hubCount === 0) {
    return {
      isFounder: true,
      label: 'Welcome',
      title: "Hi, I'm Christine",
      body: "I built HubCollector to help you turn real-life things, routines, records, and memories into living digital ‘Hubs’ you can update anytime.",
      primaryButton: { text: 'Create your first Hub', href: '/dashboard/hub/new' },
      secondaryButton: { text: 'Open Help Guide', href: '/help' },
      footerLink: { text: 'Watch the quick tour', href: '/help' },
    }
  }

  if (hubCount === 1) {
    return {
      label: 'Next best step',
      title: 'Print or scan your QR code',
      body: "Your hub is live. Download the QR code and scan it with your phone — or print a card to attach to something physical.",
      primaryButton: firstHubId
        ? { text: 'Print QR card', href: `/dashboard/hub/${firstHubId}/print` }
        : undefined,
    }
  }

  if (hubCount >= 2 && collectionCount <= 1) {
    return {
      label: 'Make this useful',
      title: 'Organize your hubs with collections',
      body: "Collections keep related hubs together — like Pets, Kitchen, or Home. Create one to stay organized as your list grows.",
      primaryButton: onCreateCollection
        ? { text: 'Create a collection', onClick: onCreateCollection }
        : undefined,
    }
  }

  if (hubCount >= 2 && allHubsPrivate) {
    return {
      label: 'Your HubCollector tip',
      title: "Your hubs are private — that's okay",
      body: "Private hubs are only visible to you when signed in. When you're ready to share one, change its visibility to Unlisted or Public in the hub's Settings tab.",
    }
  }

  if (hubCount >= 4 && !hasHubCollector) {
    return {
      label: 'Try this next',
      title: 'Tie your hubs together with a Hub Menu',
      body: "You have several hubs now. A Hub Menu creates a single QR code with links to all of them — great for a fridge, a door, or anywhere central.",
      primaryButton: { text: 'Create a Hub Menu', href: '/dashboard/hub/new' },
    }
  }

  if (hasQuickAccessHub) {
    return {
      label: 'Make this useful',
      title: 'Save HubCollector to your home screen',
      body: "For hubs you check regularly — shopping lists, workouts, maintenance logs — tap the share icon in your browser and choose 'Add to Home Screen' for one-tap access.",
    }
  }

  return null
}

export default function WelcomeCard({
  hubCount,
  collectionCount,
  allHubs,
  onCreateCollection,
}: {
  hubCount: number
  collectionCount: number
  allHubs: any[]
  onCreateCollection?: () => void
}) {
  const [photoError, setPhotoError] = useState(false)
  const allHubsPrivate = hubCount > 0 && allHubs.every(h => h.privacy_mode === 'private')
  const hasHubCollector = allHubs.some(h => h.template_id === 'hub_collector')
  const hasQuickAccessHub = allHubs.some(h =>
    ['grocery', 'workout', 'maintenance'].includes(h.template_id ?? '')
  )
  // allHubs is sorted by updated_at desc; use the oldest hub for "print your first QR"
  const firstHub = allHubs[allHubs.length - 1]

  const state = getCardState({
    hubCount,
    collectionCount,
    allHubsPrivate,
    hasHubCollector,
    hasQuickAccessHub,
    firstHubId: firstHub?.id,
    onCreateCollection,
  })

  if (!state) return null

  const labelStyle = LABEL_STYLES[state.label] ?? 'bg-stone-100 text-stone-500 border border-stone-200'

  return (
    <div className={`rounded-2xl border px-5 py-4 mb-5 ${state.isFounder ? 'bg-stone-50 border-stone-200' : 'bg-white border-stone-100'}`}>
      {/* Label chip */}
      <div className="mb-3">
        <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${labelStyle}`}>
          {state.label}
        </span>
      </div>

      {/* Founder layout: photo + text side by side */}
      {state.isFounder ? (
        <div className="flex items-start gap-3 mb-4">
          {photoError ? (
            <span className="w-14 h-14 rounded-full bg-teal-100 border border-teal-200 flex-shrink-0 flex items-center justify-center text-teal-700 text-lg font-semibold">
              C
            </span>
          ) : (
            <img
              src="/christine.jpg"
              alt="Christine, founder of HubCollector"
              className="w-14 h-14 rounded-full object-cover object-top flex-shrink-0 border border-stone-200"
              onError={() => setPhotoError(true)}
            />
          )}
          <div>
            <h3 className="text-base font-semibold text-stone-800 leading-snug">{state.title}</h3>
            <p className="text-sm text-stone-500 mt-1 leading-relaxed">{state.body}</p>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-stone-800 mb-1">{state.title}</h3>
          <p className="text-sm text-stone-500 leading-relaxed">{state.body}</p>
        </div>
      )}

      {/* Buttons */}
      {(state.primaryButton || state.secondaryButton) && (
        <div className="flex gap-2 flex-wrap">
          {state.primaryButton && (
            state.primaryButton.href ? (
              <Link
                href={state.primaryButton.href}
                className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {state.primaryButton.text}
              </Link>
            ) : (
              <button
                type="button"
                onClick={state.primaryButton.onClick}
                className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {state.primaryButton.text}
              </button>
            )
          )}
          {state.secondaryButton && (
            <Link
              href={state.secondaryButton.href}
              className="text-sm font-medium text-stone-600 border border-stone-200 hover:bg-stone-50 px-4 py-2 rounded-lg transition-colors"
            >
              {state.secondaryButton.text}
            </Link>
          )}
        </div>
      )}

      {/* Footer link */}
      {state.footerLink && (
        <div className="mt-3">
          <Link
            href={state.footerLink.href}
            className="text-xs text-stone-400 hover:text-stone-600 underline transition-colors"
          >
            {state.footerLink.text}
          </Link>
        </div>
      )}
    </div>
  )
}
