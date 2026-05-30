'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Status = 'active' | 'restricted' | 'suspended' | 'terminated'
type ModalType = 'restrict' | 'unrestrict' | 'suspend' | 'unsuspend' | 'remove-content' | 'terminate'

const STATUS_STYLE: Record<Status, string> = {
  active:     'bg-emerald-50 text-emerald-700 border border-emerald-200',
  restricted: 'bg-amber-50 text-amber-700 border border-amber-200',
  suspended:  'bg-red-50 text-red-700 border border-red-200',
  terminated: 'bg-stone-100 text-stone-500 border border-stone-200',
}

const MODAL_COPY: Record<ModalType, { title: string; body: string; confirm: string; danger: boolean }> = {
  restrict: {
    title: 'Restrict this account?',
    body: 'This user will no longer be able to create new hubs or change hub visibility. Their existing content remains visible. You can unrestrict at any time.',
    confirm: 'Restrict account',
    danger: false,
  },
  unrestrict: {
    title: 'Remove restriction?',
    body: 'This user will be restored to full access and can create new hubs again.',
    confirm: 'Remove restriction',
    danger: false,
  },
  suspend: {
    title: 'Suspend this account?',
    body: 'This user will be immediately signed out and unable to sign in. Their content remains in the database. You can unsuspend at any time.',
    confirm: 'Suspend account',
    danger: true,
  },
  unsuspend: {
    title: 'Unsuspend this account?',
    body: 'This user will be able to sign in again immediately.',
    confirm: 'Unsuspend account',
    danger: false,
  },
  'remove-content': {
    title: 'Remove all content?',
    body: 'All hubs and their content blocks will be permanently deleted. Saved hubs referencing their content will also be removed. This cannot be undone.',
    confirm: 'Delete all content',
    danger: true,
  },
  terminate: {
    title: 'Terminate account?',
    body: 'This will permanently delete their account, login credentials, all hubs, content, and collections. This cannot be undone.',
    confirm: 'Terminate account',
    danger: true,
  },
}

export default function ModerationPanel({
  userId,
  username,
  initialStatus,
  hubCount,
}: {
  userId: string
  username: string
  initialStatus: Status
  hubCount: number
}) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>(initialStatus)
  const [modal, setModal] = useState<ModalType | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runAction(action: ModalType) {
    setLoading(true)
    setError(null)

    let res: Response

    if (action === 'terminate') {
      res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    } else if (action === 'remove-content') {
      res = await fetch(`/api/admin/users/${userId}/content`, { method: 'DELETE' })
    } else {
      res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
    }

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
      return
    }

    if (action === 'terminate') {
      router.push('/admin')
      return
    }

    const nextStatus: Record<string, Status> = {
      restrict:   'restricted',
      unrestrict: 'active',
      suspend:    'suspended',
      unsuspend:  'active',
    }
    if (nextStatus[action]) setStatus(nextStatus[action])

    setModal(null)
    setConfirmText('')
    setLoading(false)
  }

  const copy = modal ? MODAL_COPY[modal] : null
  const terminateReady = confirmText === username

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Moderation</h2>
        <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${STATUS_STYLE[status]}`}>
          {status}
        </span>
      </div>

      {status === 'terminated' ? (
        <p className="px-5 py-6 text-sm text-gray-400 text-center">This account has been terminated.</p>
      ) : (
        <div className="p-5 space-y-4">
          {/* Functionality */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Limit functionality</p>
            <div className="flex gap-2">
              {status === 'restricted' ? (
                <ActionButton label="Unrestrict" description="Restore full access" onClick={() => setModal('unrestrict')} />
              ) : (
                <ActionButton label="Restrict" description="Block new hub creation" onClick={() => setModal('restrict')} disabled={status === 'suspended'} />
              )}
              {status === 'suspended' ? (
                <ActionButton label="Unsuspend" description="Restore login access" onClick={() => setModal('unsuspend')} />
              ) : (
                <ActionButton label="Suspend" description="Block login immediately" onClick={() => setModal('suspend')} />
              )}
            </div>
          </div>

          {/* Removal */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Content & account removal</p>
            <div className="flex gap-2 flex-wrap">
              <ActionButton
                label={`Remove all content${hubCount > 0 ? ` (${hubCount} hubs)` : ''}`}
                description="Permanently deletes all hubs"
                onClick={() => setModal('remove-content')}
                variant="danger-outline"
                disabled={hubCount === 0}
              />
              <ActionButton
                label="Terminate account"
                description="Deletes account and all data"
                onClick={() => setModal('terminate')}
                variant="danger"
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {modal && copy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setModal(null); setConfirmText('') }} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">{copy.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">{copy.body}</p>

            {modal === 'terminate' && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1.5">
                  Type <span className="font-mono font-semibold text-gray-700">{username}</span> to confirm
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  placeholder={username}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                  autoFocus
                />
              </div>
            )}

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => { setModal(null); setConfirmText(''); setError(null) }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => runAction(modal)}
                disabled={loading || (modal === 'terminate' && !terminateReady)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  copy.danger
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-stone-800 hover:bg-stone-700 text-white'
                }`}
              >
                {loading ? 'Working…' : copy.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionButton({
  label, description, onClick, disabled, variant = 'default',
}: {
  label: string
  description: string
  onClick: () => void
  disabled?: boolean
  variant?: 'default' | 'danger-outline' | 'danger'
}) {
  const styles = {
    default:        'border-gray-200 text-gray-700 hover:bg-gray-50',
    'danger-outline': 'border-red-200 text-red-600 hover:bg-red-50',
    danger:         'border-red-600 bg-red-600 text-white hover:bg-red-700',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={description}
      className={`flex flex-col items-start px-3.5 py-2.5 rounded-xl border text-left transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${styles[variant]}`}
    >
      <span className="text-xs font-semibold">{label}</span>
      <span className={`text-[10px] mt-0.5 ${variant === 'danger' ? 'text-red-200' : 'text-gray-400'}`}>{description}</span>
    </button>
  )
}
