'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const USERNAME_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/

function validateUsername(val: string): string | null {
  if (val.length < 3) return 'At least 3 characters'
  if (val.length > 30) return 'At most 30 characters'
  if (!USERNAME_RE.test(val)) return 'Lowercase letters, numbers, and hyphens only — no leading or trailing hyphens'
  return null
}

export default function SetupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, username_confirmed')
        .eq('id', user.id)
        .single()

      if ((profile as any)?.username_confirmed) {
        router.replace('/dashboard')
        return
      }

      setUserId(user.id)
      setUsername((profile as any)?.username ?? '')
      setLoading(false)
    }
    init()
  }, [router, supabase])

  const checkAvailability = useCallback(async (val: string, uid: string) => {
    setChecking(true)
    setAvailable(null)
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', val)
      .neq('id', uid)
      .maybeSingle()
    setAvailable(!data)
    setChecking(false)
  }, [supabase])

  useEffect(() => {
    if (!userId || !username) return
    const err = validateUsername(username)
    setValidationError(err)
    setAvailable(null)
    if (err) return

    const timer = setTimeout(() => checkAvailability(username, userId), 400)
    return () => clearTimeout(timer)
  }, [username, userId, checkAvailability])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || validationError || !available) return
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ username, username_confirmed: true })
      .eq('id', userId)

    if (updateError) {
      if (updateError.code === '23505') {
        setError('That username was just taken — try another.')
      } else {
        setError(updateError.message)
      }
      setSaving(false)
      return
    }

    router.push('/dashboard')
  }

  const inputOk = !validationError && available === true
  const showAvailability = !validationError && username.length >= 3 && !checking

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Choose your username</h1>
        <p className="text-gray-500 text-sm mb-6">
          Your username appears in every hub URL you share or print.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="yourname"
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
                validationError
                  ? 'border-red-300 focus:ring-red-400'
                  : inputOk
                  ? 'border-green-400 focus:ring-green-400'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />

            <div className="mt-1.5 min-h-[18px]">
              {validationError && (
                <p className="text-xs text-red-500">{validationError}</p>
              )}
              {!validationError && checking && (
                <p className="text-xs text-gray-400">Checking…</p>
              )}
              {showAvailability && available === true && (
                <p className="text-xs text-green-600">✓ Available</p>
              )}
              {showAvailability && available === false && (
                <p className="text-xs text-red-500">Already taken</p>
              )}
            </div>
          </div>

          {username && !validationError && (
            <div className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
              <p className="text-xs text-gray-400 mb-0.5">Your hub URLs will look like</p>
              <p className="text-xs font-mono text-gray-600 break-all">
                {siteUrl}/h/<span className="text-blue-600 font-semibold">{username}</span>/your-hub-slug
              </p>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <p className="text-xs text-amber-700">
              <strong>Choose carefully.</strong> Changing your username later will break any QR codes you&apos;ve printed.
            </p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving || !!validationError || available !== true}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          >
            {saving ? 'Saving…' : 'Confirm username'}
          </button>
        </form>
      </div>
    </div>
  )
}
