'use client'

import { useState, useEffect, useRef } from 'react'
import { ContentBlock } from '@/lib/types'

// ── Types & metadata ─────────────────────────────────────────────────────────

type BlockType = 'text' | 'checklist' | 'image' | 'timeline' | 'audio'

const BLOCK_TYPE_META: Record<BlockType, { label: string; summary: string }> = {
  text:      { label: 'Text / Note',  summary: 'Paragraphs, stories, instructions' },
  checklist: { label: 'Checklist',    summary: 'Tappable to-do items' },
  image:     { label: 'Image',        summary: 'Photo with optional caption' },
  timeline:  { label: 'Timeline',     summary: 'Dated events or history log' },
  audio:     { label: 'Voice Note',   summary: 'Record or upload audio' },
}

type TextData      = { label: string; text: string }
type ChecklistData = { label: string; items: { id: string; text: string }[] }
type ImageData     = { caption: string; url: string }
type TimelineData  = { label: string; events: { id: string; date: string; text: string }[] }
type AudioData     = { label: string; url: string }

function uid() { return Math.random().toString(36).slice(2) }

function blockSummary(block: ContentBlock): string {
  const d = block.data as any
  switch (block.type) {
    case 'text':      return d.label || 'Text block'
    case 'checklist': return `${d.label || 'Checklist'} — ${d.items?.length ?? 0} items`
    case 'image':     return d.caption || 'Image'
    case 'timeline':  return `${d.label || 'Timeline'} — ${d.events?.length ?? 0} events`
    case 'audio':     return d.label || 'Voice note'
    default:          return block.type
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ContentBlocksEditor({ hubId }: { hubId: string }) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [pickingType, setPickingType] = useState(false)
  const [addingType, setAddingType] = useState<BlockType | null>(null)

  useEffect(() => {
    fetch(`/api/hub/${hubId}/content_blocks`)
      .then(r => r.json())
      .then(json => { setBlocks(json.content_blocks ?? []); setLoading(false) })
  }, [hubId])

  async function saveBlock(type: BlockType, data: object) {
    const res = await fetch(`/api/hub/${hubId}/content_blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data, sort_order: blocks.length }),
    })
    const json = await res.json()
    if (!json.error) {
      setBlocks(prev => [...prev, json.content_block])
      setAddingType(null)
      setPickingType(false)
    }
    return json
  }

  async function deleteBlock(id: string) {
    await fetch(`/api/hub/${hubId}/content_blocks/${id}`, { method: 'DELETE' })
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  if (loading) return <div className="text-sm text-gray-400">Loading…</div>

  return (
    <div className="space-y-3">
      {/* Existing blocks */}
      {blocks.map(block => (
        <div key={block.id} className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 bg-white gap-3">
          <div className="min-w-0">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide mr-2">
              {BLOCK_TYPE_META[block.type as BlockType]?.label ?? block.type}
            </span>
            <span className="text-sm text-gray-700">{blockSummary(block)}</span>
          </div>
          <button
            type="button"
            onClick={() => deleteBlock(block.id)}
            className="text-gray-300 hover:text-red-400 text-xl flex-shrink-0 transition-colors leading-none"
          >
            ×
          </button>
        </div>
      ))}

      {/* Add block */}
      {!pickingType && !addingType && (
        <button
          type="button"
          onClick={() => setPickingType(true)}
          className="w-full border border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors"
        >
          + Add Content Block
        </button>
      )}

      {pickingType && !addingType && (
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
          <p className="text-xs font-medium text-gray-600">Choose block type</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(BLOCK_TYPE_META) as [BlockType, { label: string; summary: string }][]).map(([type, meta]) => (
              <button
                key={type}
                type="button"
                onClick={() => { setAddingType(type); setPickingType(false) }}
                className="border border-gray-200 bg-white rounded-lg p-3 text-left hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <div className="text-sm font-medium text-gray-700">{meta.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{meta.summary}</div>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setPickingType(false)} className="text-xs text-gray-400 hover:text-gray-600">
            Cancel
          </button>
        </div>
      )}

      {addingType === 'text'      && <TextForm      onSave={d => saveBlock('text', d)}      onCancel={() => setAddingType(null)} />}
      {addingType === 'checklist' && <ChecklistForm onSave={d => saveBlock('checklist', d)} onCancel={() => setAddingType(null)} />}
      {addingType === 'image'     && <ImageForm     hubId={hubId} blockIndex={blocks.length} onSave={d => saveBlock('image', d)} onCancel={() => setAddingType(null)} />}
      {addingType === 'timeline'  && <TimelineForm  onSave={d => saveBlock('timeline', d)}  onCancel={() => setAddingType(null)} />}
      {addingType === 'audio'     && <AudioForm     hubId={hubId} onSave={d => saveBlock('audio', d)} onCancel={() => setAddingType(null)} />}
    </div>
  )
}

// ── Shared form shell ─────────────────────────────────────────────────────────

function FormShell({ title, onCancel, children }: { title: string; onCancel: () => void; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
      <p className="text-xs font-medium text-gray-600">{title}</p>
      {children}
      <button type="button" onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
        Cancel
      </button>
    </div>
  )
}

function SaveButton({ saving, disabled }: { saving: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={saving || disabled}
      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
    >
      {saving ? 'Saving…' : 'Save'}
    </button>
  )
}

// ── Text form ─────────────────────────────────────────────────────────────────

function TextForm({ onSave, onCancel }: { onSave: (d: TextData) => Promise<any>; onCancel: () => void }) {
  const [label, setLabel] = useState('')
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!text.trim()) { setError('Text is required.'); return }
    setSaving(true)
    const res = await onSave({ label: label.trim(), text: text.trim() })
    if (res.error) { setError(res.error); setSaving(false) }
  }

  return (
    <FormShell title="Text / Note" onCancel={onCancel}>
      <input
        type="text"
        value={label}
        onChange={e => setLabel(e.target.value)}
        placeholder="Label (optional) — e.g. Artist Statement"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Your text here…"
        rows={5}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex gap-2" onClick={submit}><SaveButton saving={saving} /></div>
    </FormShell>
  )
}

// ── Checklist form ────────────────────────────────────────────────────────────

function ChecklistForm({ onSave, onCancel }: { onSave: (d: ChecklistData) => Promise<any>; onCancel: () => void }) {
  const [label, setLabel] = useState('')
  const [items, setItems] = useState([{ id: uid(), text: '' }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function addItem() { setItems(prev => [...prev, { id: uid(), text: '' }]) }
  function removeItem(id: string) { setItems(prev => prev.filter(i => i.id !== id)) }
  function updateItem(id: string, text: string) { setItems(prev => prev.map(i => i.id === id ? { ...i, text } : i)) }

  async function submit() {
    const valid = items.filter(i => i.text.trim())
    if (!valid.length) { setError('Add at least one item.'); return }
    setSaving(true)
    const res = await onSave({ label: label.trim(), items: valid.map(i => ({ id: i.id, text: i.text.trim() })) })
    if (res.error) { setError(res.error); setSaving(false) }
  }

  return (
    <FormShell title="Checklist" onCancel={onCancel}>
      <input
        type="text"
        value={label}
        onChange={e => setLabel(e.target.value)}
        placeholder="Label — e.g. Winterize Checklist"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={item.id} className="flex gap-2 items-center">
            <span className="text-gray-300 text-sm select-none w-4">☐</span>
            <input
              type="text"
              value={item.text}
              onChange={e => updateItem(item.id, e.target.value)}
              placeholder={`Item ${idx + 1}`}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {items.length > 1 && (
              <button type="button" onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-400 text-xl leading-none transition-colors">×</button>
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={addItem} className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
        + Add item
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex gap-2" onClick={submit}><SaveButton saving={saving} /></div>
    </FormShell>
  )
}

// ── Image form ────────────────────────────────────────────────────────────────

function ImageForm({ hubId, blockIndex, onSave, onCancel }: { hubId: string; blockIndex: number; onSave: (d: ImageData) => Promise<any>; onCancel: () => void }) {
  const [caption, setCaption] = useState('')
  const [url, setUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleUpload(file: File) {
    setUploading(true)
    const { uploadPhoto } = await import('@/lib/supabase/uploadPhoto')
    const uploaded = await uploadPhoto(file, hubId, blockIndex)
    if (uploaded) setUrl(uploaded)
    else setError('Upload failed.')
    setUploading(false)
  }

  async function submit() {
    if (!url.trim()) { setError('Image URL is required.'); return }
    setSaving(true)
    const res = await onSave({ caption: caption.trim(), url: url.trim() })
    if (res.error) { setError(res.error); setSaving(false) }
  }

  return (
    <FormShell title="Image" onCancel={onCancel}>
      <div className="space-y-2">
        <p className="text-xs text-gray-500">Upload or paste a URL</p>
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
          className="block text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-200 file:text-sm file:text-gray-600 file:bg-white hover:file:bg-gray-50"
        />
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://example.com/photo.jpg"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {url && <img src={url} alt="Preview" className="h-24 rounded-lg object-cover border border-gray-200" />}
        {uploading && <p className="text-xs text-gray-400">Uploading…</p>}
      </div>
      <input
        type="text"
        value={caption}
        onChange={e => setCaption(e.target.value)}
        placeholder="Caption (optional)"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex gap-2" onClick={submit}><SaveButton saving={saving} disabled={uploading} /></div>
    </FormShell>
  )
}

// ── Timeline form ─────────────────────────────────────────────────────────────

function TimelineForm({ onSave, onCancel }: { onSave: (d: TimelineData) => Promise<any>; onCancel: () => void }) {
  const [label, setLabel] = useState('')
  const [events, setEvents] = useState([{ id: uid(), date: '', text: '' }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function addEvent() { setEvents(prev => [...prev, { id: uid(), date: '', text: '' }]) }
  function removeEvent(id: string) { setEvents(prev => prev.filter(e => e.id !== id)) }
  function updateEvent(id: string, field: 'date' | 'text', value: string) {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  async function submit() {
    const valid = events.filter(e => e.text.trim())
    if (!valid.length) { setError('Add at least one event.'); return }
    setSaving(true)
    const res = await onSave({ label: label.trim(), events: valid.map(e => ({ id: e.id, date: e.date.trim(), text: e.text.trim() })) })
    if (res.error) { setError(res.error); setSaving(false) }
  }

  return (
    <FormShell title="Timeline" onCancel={onCancel}>
      <input
        type="text"
        value={label}
        onChange={e => setLabel(e.target.value)}
        placeholder="Label — e.g. Service History"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="space-y-2">
        {events.map((event, idx) => (
          <div key={event.id} className="flex gap-2">
            <input
              type="text"
              value={event.date}
              onChange={e => updateEvent(event.id, 'date', e.target.value)}
              placeholder="Date"
              className="w-24 flex-shrink-0 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={event.text}
              onChange={e => updateEvent(event.id, 'text', e.target.value)}
              placeholder={`Event ${idx + 1}`}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {events.length > 1 && (
              <button type="button" onClick={() => removeEvent(event.id)} className="text-gray-300 hover:text-red-400 text-xl leading-none transition-colors">×</button>
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={addEvent} className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
        + Add event
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex gap-2" onClick={submit}><SaveButton saving={saving} /></div>
    </FormShell>
  )
}

// ── Audio form ────────────────────────────────────────────────────────────────

const AUDIO_SUGGESTIONS = ['Artist Reflection', 'Family Story', 'Voice Instructions', 'Welcome Message', 'Care Notes', 'Recipe Story']

function formatTime(s: number) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }

function AudioForm({ hubId, onSave, onCancel }: { hubId: string; onSave: (d: AudioData) => Promise<any>; onCancel: () => void }) {
  const [mode, setMode] = useState<'record' | 'upload'>('record')
  const [label, setLabel] = useState('')
  const [recording, setRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState('')
  const [recordingTime, setRecordingTime] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function startRecording() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
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
      setError('Microphone access denied.')
    }
  }

  function stopRecording() {
    recorderRef.current?.stop()
    setRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  async function save(file: Blob | File) {
    if (!label.trim()) { setError('Please add a label.'); return }
    setSaving(true)
    setError('')
    const { uploadAudio } = await import('@/lib/supabase/uploadAudio')
    const url = await uploadAudio(file, hubId)
    if (!url) { setError('Upload failed. Check the hub-audio bucket in Supabase.'); setSaving(false); return }
    const res = await onSave({ label: label.trim(), url })
    if (res.error) { setError(res.error); setSaving(false) }
  }

  return (
    <FormShell title="Voice Note" onCancel={onCancel}>
      <div>
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Label — e.g. Artist Reflection"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex flex-wrap gap-1 mt-1.5">
          {AUDIO_SUGGESTIONS.map(s => (
            <button key={s} type="button" onClick={() => setLabel(s)} className="text-xs text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 hover:bg-blue-50 transition-colors">
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        {(['record', 'upload'] as const).map(m => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${mode === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
            {m === 'record' ? 'Record' : 'Upload File'}
          </button>
        ))}
      </div>

      {mode === 'record' && !recordedUrl && (
        !recording
          ? <button type="button" onClick={startRecording} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
              <span className="w-2 h-2 rounded-full bg-white inline-block" /> Start Recording
            </button>
          : <button type="button" onClick={stopRecording} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
              <span className="w-2 h-2 rounded bg-white inline-block" /> Stop — {formatTime(recordingTime)}
            </button>
      )}

      {mode === 'record' && recordedUrl && (
        <div className="space-y-2">
          <audio src={recordedUrl} controls className="w-full" />
          <div className="flex gap-2">
            <button type="button" onClick={() => save(recordedBlob!)} disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              {saving ? 'Saving…' : 'Save Recording'}
            </button>
            <button type="button" onClick={() => { setRecordedBlob(null); setRecordedUrl('') }} className="text-sm text-gray-500 hover:text-gray-700 px-3 transition-colors">
              Re-record
            </button>
          </div>
        </div>
      )}

      {mode === 'upload' && (
        <input type="file" accept="audio/*" disabled={saving}
          onChange={async e => { const f = e.target.files?.[0]; if (f) await save(f) }}
          className="block text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-200 file:text-sm file:text-gray-600 file:bg-white hover:file:bg-gray-50"
        />
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </FormShell>
  )
}
