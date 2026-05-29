'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

// ── Feature announcement cards ────────────────────────────────────────────────
// Add a new entry here each time a notable feature ships. Give it a unique key
// and bump the version suffix (e.g. v2) if you update an existing announcement.
// Feature cards show to all users with ≥ 1 Hub who haven't dismissed them yet.
// Journey cards always take priority; feature cards appear once the journey
// card for the current milestone has been dismissed or no longer applies.

type FeatureCardDef = {
  key: string
  label: string
  title: string
  body: string
  primaryButton?: { text: string; href?: string; onClick?: () => void }
}

const FEATURE_CARDS: FeatureCardDef[] = [
  {
    key: 'feature-explore-v1',
    label: 'New feature',
    title: 'Discover what others are making',
    body: "The Explore page is live. Browse public Hubs from the community, filter by template type, and see what's trending.",
    primaryButton: { text: 'Go to Explore »', href: '/explore' },
  },
  {
    key: 'feature-save-hubs-v1',
    label: 'New feature',
    title: 'Save Hubs from other people',
    body: "Tap Save Hub on any public Hub to add it to your dashboard. Organise saved Hubs into Collections — even include them in Hub Collector pages.",
    primaryButton: { text: 'Browse Hubs to save »', href: '/explore' },
  },
  {
    key: 'feature-profile-v1',
    label: 'New feature',
    title: 'Your public profile is live',
    body: "Add your name, bio, photo, and social links. Visitors can see your public Hubs and the badges you've earned. Your profile is at /h/your-username.",
    primaryButton: { text: 'Edit your profile »', href: '/settings/profile' },
  },
  {
    key: 'feature-social-v1',
    label: 'New feature',
    title: 'Hearts, shares, and views',
    body: 'Other users can now heart your Hubs and share them directly from their phones. See your engagement counts on Hub cards and on your profile page.',
  },
]

// ── Styling ───────────────────────────────────────────────────────────────────

const LABEL_STYLES: Record<string, string> = {
  'Welcome':           'bg-teal-50 text-teal-700 border border-teal-200',
  'Next step':         'bg-blue-50 text-blue-700 border border-blue-200',
  'Getting organized': 'bg-amber-50 text-amber-700 border border-amber-200',
  "You're rolling":    'bg-green-50 text-green-700 border border-green-200',
  "You've got it":     'bg-stone-100 text-stone-500 border border-stone-200',
  'New feature':       'bg-violet-50 text-violet-700 border border-violet-200',
}

// ── Types ─────────────────────────────────────────────────────────────────────

type CardDef = {
  key: string
  label: string
  title: string
  body: string
  isFounder?: boolean
  primaryButton?: { text: string; href?: string; onClick?: () => void }
  secondaryButton?: { text: string; href: string }
  footerLink?: { text: string; href: string }
}

// ── localStorage helpers ──────────────────────────────────────────────────────

const STORAGE_KEY = 'hc_dismissed_cards'

function getDismissed(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveDismissed(keys: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys))
  } catch {}
}

// ── Card selection ────────────────────────────────────────────────────────────

function getActiveCard({
  hubCount,
  dismissed,
  firstHubId,
  onCreateCollection,
}: {
  hubCount: number
  dismissed: string[]
  firstHubId?: string
  onCreateCollection?: () => void
}): CardDef | null {
  const notSeen = (key: string) => !dismissed.includes(key)

  // Journey cards — one per milestone, shown until dismissed or milestone passed
  const journeyCard: CardDef | null = (() => {
    if (hubCount === 0 && notSeen('journey-welcome-v1')) {
      return {
        key: 'journey-welcome-v1',
        isFounder: true,
        label: 'Welcome',
        title: "Hi, I'm Christine",
        body: "I built HubCollector to help you turn real-life things, routines, records, and memories into living digital 'Hubs' you can update anytime.",
        primaryButton: { text: 'Create your first Hub', href: '/dashboard/hub/new' },
        secondaryButton: { text: 'Open Help Guide', href: '/help' },
        footerLink: { text: 'Watch the quick tour', href: '/help' },
      }
    }

    if (hubCount === 1 && notSeen('journey-first-hub-v1')) {
      return {
        key: 'journey-first-hub-v1',
        isFounder: true,
        label: 'Next step',
        title: "You've created your first Hub",
        body: "The magic really happens when you print the QR code and attach it to something real. Try scanning it with your phone camera first — it's a good moment.",
        primaryButton: firstHubId
          ? { text: 'Print QR card', href: `/dashboard/hub/${firstHubId}/print` }
          : undefined,
      }
    }

    if (hubCount >= 2 && notSeen('journey-growing-v1')) {
      return {
        key: 'journey-growing-v1',
        isFounder: true,
        label: 'Getting organized',
        title: "You're building something",
        body: "As your Hubs grow, Collections are how this becomes a real system for your life. Group related Hubs together — like Pets, Kitchen, or Home.",
        primaryButton: onCreateCollection
          ? { text: 'Create a Collection', onClick: onCreateCollection }
          : undefined,
      }
    }

    if (hubCount >= 4 && notSeen('journey-established-v1')) {
      return {
        key: 'journey-established-v1',
        isFounder: true,
        label: "You've got it",
        title: "You've got the hang of it",
        body: "From here, HubCollector grows with you. I'll keep sharing tips and new features as we go — reach out anytime. I'm still building this alongside you.",
      }
    }

    return null
  })()

  // Feature cards — show to users with ≥ 1 Hub, after journey card is resolved
  const featureCard = hubCount >= 1
    ? (FEATURE_CARDS.find(f => notSeen(f.key)) ?? null)
    : null

  // Journey card takes priority; feature card fills in when no journey card applies
  return journeyCard ?? featureCard
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function WelcomeCard({
  hubCount,
  collectionCount: _collectionCount,
  allHubs,
  onCreateCollection,
}: {
  hubCount: number
  collectionCount: number
  allHubs: any[]
  onCreateCollection?: () => void
}) {
  const [dismissed, setDismissed] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)
  const [photoError, setPhotoError] = useState(false)

  useEffect(() => {
    setDismissed(getDismissed())
    setMounted(true)
  }, [])

  function dismiss(key: string) {
    const next = [...dismissed, key]
    setDismissed(next)
    saveDismissed(next)
  }

  // Avoid localStorage hydration mismatch — render nothing until client-mounted
  if (!mounted) return null

  const firstHub = allHubs[0]

  const card = getActiveCard({
    hubCount,
    dismissed,
    firstHubId: firstHub?.id,
    onCreateCollection,
  })

  if (!card) return null

  const labelStyle = LABEL_STYLES[card.label] ?? 'bg-stone-100 text-stone-500 border border-stone-200'

  return (
    <div className={`relative rounded-2xl border px-5 py-4 mb-5 ${card.isFounder ? 'bg-stone-50 border-stone-200' : 'bg-white border-stone-100'}`}>

      {/* Dismiss */}
      <button
        type="button"
        onClick={() => dismiss(card.key)}
        aria-label="Dismiss"
        className="absolute top-3 right-3 text-stone-300 hover:text-stone-500 transition-colors text-xl leading-none"
      >
        ×
      </button>

      {/* Label chip */}
      <div className="mb-3">
        <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${labelStyle}`}>
          {card.label}
        </span>
      </div>

      {/* Founder layout: photo + text */}
      {card.isFounder ? (
        <div className="flex items-start gap-3 mb-4 pr-5">
          {photoError ? (
            <span className="w-14 h-14 rounded-full bg-teal-100 border border-teal-200 flex-shrink-0 flex items-center justify-center text-teal-700 text-lg font-semibold">
              C
            </span>
          ) : (
            <img
              src="/Christine.jpg"
              alt="Christine, founder of HubCollector"
              className="w-14 h-14 rounded-full object-cover object-top flex-shrink-0 border border-stone-200"
              onError={() => setPhotoError(true)}
            />
          )}
          <div>
            <h3 className="text-base font-semibold text-stone-800 leading-snug">{card.title}</h3>
            <p className="text-sm text-stone-500 mt-1 leading-relaxed">{card.body}</p>
          </div>
        </div>
      ) : (
        <div className="mb-4 pr-5">
          <h3 className="text-sm font-semibold text-stone-800 mb-1">{card.title}</h3>
          <p className="text-sm text-stone-500 leading-relaxed">{card.body}</p>
        </div>
      )}

      {/* Buttons */}
      {(card.primaryButton || card.secondaryButton) && (
        <div className={`flex gap-2 flex-wrap${card.isFounder ? ' ml-[68px]' : ''}`}>
          {card.primaryButton && (
            card.primaryButton.href ? (
              <Link
                href={card.primaryButton.href}
                className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {card.primaryButton.text}
              </Link>
            ) : (
              <button
                type="button"
                onClick={card.primaryButton.onClick}
                className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {card.primaryButton.text}
              </button>
            )
          )}
          {card.secondaryButton && (
            <Link
              href={card.secondaryButton.href}
              className="text-sm font-medium text-stone-600 border border-stone-200 hover:bg-stone-50 px-4 py-2 rounded-lg transition-colors"
            >
              {card.secondaryButton.text}
            </Link>
          )}
        </div>
      )}

      {/* Footer link */}
      {card.footerLink && (
        <div className="mt-3">
          <Link
            href={card.footerLink.href}
            className="text-xs text-stone-400 hover:text-stone-600 underline transition-colors"
          >
            {card.footerLink.text}
          </Link>
        </div>
      )}
    </div>
  )
}
