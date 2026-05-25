'use client'

import { useState, useEffect, useRef } from 'react'
import { ContentBlock } from '@/lib/types'
import { uploadAudio } from '@/lib/supabase/uploadAudio'

type AudioData = { label: string; url: string }

const LABEL_SUGGESTIONS = [
  'Artist Reflection',
  'Family Story',
  'Voice Instructions',
  'Welcome Message',
  'Care Notes',
  'Recipe Story',
]

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function AudioBlockEditor({ hubId }: { hubId: string }) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [mode, setMode] = useState<'record' | 'upload'>('record')
  const [label, setLabel] = useState('')
  const [recording, setRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState('')
  const [recordingTime, setRecordingTime] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch(`/api/hub/${hubId}/content_blocks`)
      .then(r => r.json())
      .then(json => {
        setBlocks((json.content_blocks ?? []).filter((b: ContentBlock) => b.type === 'audio'))
        setLoading(false)
      })
  }, [hubId])

  async function startRecording() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setRecordedBlob(blob)
        setRecordedUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop())
      }

      recorder.start()
      setRecording(true)
      setRecordingTime(0)
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
    } catch {
      setError('Microphone access denied. Please allow microphone access and try again.')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  async function saveAudio(file: Blob | File) {
    if (!label.trim()) { setError('Please add a label for this audio clip.'); return }
    setUploading(true)
    setError('')
    const url = await uploadAudio(file, hubId)
    if (!url) {
      setError('Upload failed. Make sure the hub-audio storage bucket exists in Supabase and is set to public.')
      setUploading(false)
      return
    }
    const res = await fetch(`/api/hub/${hubId}/content_blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'audio', data: { label: label.trim(), url }, sort_order: blocks.length }),
    })
    const json = await res.json()
    if (json.error) { setError(json.error); setUploading(false); return }
    setBlocks(prev => [...prev, json.content_block])
    resetForm()
  }

  async function deleteBlock(blockId: string) {
    await fetch(`/api/hub/${hubId}/content_blocks/${blockId}`, { method: 'DELETE' })
    setBlocks(prev => prev.filter(b => b.id !== blockId))
  }

  function resetForm() {
    setAdding(false)
    setLabel('')
    setRecordedBlob(null)
    setRecordedUrl('')
    setRecordingTime(0)
    setError('')
    setMode('record')
    setUploading(false)
  }

  if (loading) return <div className="text-sm text-gray-400">Loading…</div>

  return (
    <div className="space-y-3">
      {/* Existing audio blocks */}
      {blocks.map(block => {
        const d = block.data as AudioData
        return (
          <div key={block.id} className="flex items-center gap-3 border border-gray-200 rounded-xl p-3 bg-white">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 mb-1.5">{d.label}</p>
              <audio src={d.url} controls className="w-full" style={{ height: '32px' }} />
            </div>
            <button
              type="button"
              onClick={() => deleteBlock(block.id)}
              className="text-gray-300 hover:text-red-400 text-xl leading-none flex-shrink-0 transition-colors"
            >
              ×
            </button>
          </div>
        )
      })}

      {/* Add form */}
      {adding ? (
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-4">
          {/* Label */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Artist Reflection"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {LABEL_SUGGESTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setLabel(s)}
                  className="text-xs text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 hover:bg-blue-50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2">
            {(['record', 'upload'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  mode === m
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {m === 'record' ? 'Record' : 'Upload File'}
              </button>
            ))}
          </div>

          {/* Record mode */}
          {mode === 'record' && (
            <div className="space-y-3">
              {!recordedUrl ? (
                <>
                  {!recording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-white inline-block" />
                      Start Recording
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                    >
                      <span className="w-2 h-2 rounded bg-white inline-block" />
                      Stop — {formatTime(recordingTime)}
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <audio src={recordedUrl} controls className="w-full" />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveAudio(recordedBlob!)}
                      disabled={uploading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      {uploading ? 'Saving…' : 'Save Recording'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRecordedBlob(null); setRecordedUrl('') }}
                      className="text-sm text-gray-500 hover:text-gray-700 px-3 transition-colors"
                    >
                      Re-record
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload mode */}
          {mode === 'upload' && (
            <div className="space-y-2">
              <input
                type="file"
                accept="audio/mp3,audio/mpeg,audio/m4a,audio/wav,audio/webm,audio/*"
                disabled={uploading}
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (file) await saveAudio(file)
                }}
                className="block text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-200 file:text-sm file:text-gray-600 file:bg-white hover:file:bg-gray-50"
              />
              {uploading && <p className="text-sm text-gray-400">Uploading…</p>}
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="button" onClick={resetForm} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-full border border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors"
        >
          + Add Voice Note
        </button>
      )}
    </div>
  )
}
