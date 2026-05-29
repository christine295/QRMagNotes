'use client'

import { useState, useEffect, useRef } from 'react'
import { ContentBlock } from '@/lib/types'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ── Types & metadata ─────────────────────────────────────────────────────────

type BlockType = 'text' | 'checklist' | 'image' | 'timeline' | 'audio' | 'link' | 'phone' | 'file' | 'collection_menu'

const BLOCK_TYPE_META: Record<BlockType, { label: string; summary: string }> = {
  text:            { label: 'Text / Note',    summary: 'Paragraphs, stories, instructions' },
  checklist:       { label: 'Checklist',      summary: 'Tappable to-do items' },
  image:           { label: 'Image',          summary: 'Photo with optional caption' },
  timeline:        { label: 'Timeline',       summary: 'Dated events or history log' },
  audio:           { label: 'Voice Note',     summary: 'Record or upload audio' },
  link:            { label: 'Link Button',    summary: 'Clickable link or URL button' },
  phone:           { label: 'Phone Number',   summary: 'Tap-to-call button' },
  file:            { label: 'File / PDF',     summary: 'Upload a PDF or file' },
  collection_menu: { label: 'Hub Collector',  summary: 'Button menu from a collection of hubs' },
}

type TextData           = { label: string; text: string; date?: string }
type CollectionMenuData = { collection_id: string; excluded_hub_ids: string[] }
type ChecklistData = { label: string; items: { id: string; text: string }[] }
type ImageData     = { caption: string; url: string }
type TimelineData  = { label: string; events: { id: string; date: string; text: string }[] }
type AudioData     = { label: string; url: string; date?: string }
type LinkData      = { label: string; url: string }
type PhoneData     = { label: string; url: string }
type FileData      = { label: string; url: string }

function uid() { return Math.random().toString(36).slice(2) }

function blockHasContent(block: ContentBlock): boolean {
  const d = block.data as any
  if (d._templateDefault) return false
  switch (block.type) {
    case 'text':      return !!(d.text?.trim())
    case 'image':     return !!(d.url?.trim())
    case 'audio':     return !!(d.url?.trim())
    case 'link':      return !!(d.url?.trim())
    case 'phone':     return !!(d.url?.trim())
    case 'file':      return !!(d.url?.trim())
    case 'checklist':       return Array.isArray(d.items) && d.items.length > 0
    case 'timeline':        return Array.isArray(d.events) && d.events.length > 0
    case 'collection_menu': return !!(d.collection_id?.trim())
    default:                return false
  }
}

function blockSummary(block: ContentBlock): string {
  const d = block.data as any
  switch (block.type) {
    case 'text':      return d.label || 'Text block'
    case 'checklist': return `${d.label || 'Checklist'} — ${d.items?.length ?? 0} items`
    case 'image':     return d.caption || 'Image'
    case 'timeline':  return `${d.label || 'Timeline'} — ${d.events?.length ?? 0} events`
    case 'audio':     return d.label || 'Voice note'
    case 'link':      return d.label || d.url || 'Link'
    case 'phone':     return d.label || d.url || 'Phone'
    case 'file':            return d.label || 'File'
    case 'collection_menu': return d.collection_id ? 'Collection linked' : 'No collection selected'
    default:                return block.type
  }
}

// ── Drag handle icon ─────────────────────────────────────────────────────────

const GripIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <circle cx="5" cy="4" r="1.25" /><circle cx="11" cy="4" r="1.25" />
    <circle cx="5" cy="8" r="1.25" /><circle cx="11" cy="8" r="1.25" />
    <circle cx="5" cy="12" r="1.25" /><circle cx="11" cy="12" r="1.25" />
  </svg>
)

// ── Sortable block row wrapper ────────────────────────────────────────────────

function SortableBlockRow({
  id,
  children,
}: {
  id: string
  children: (dragHandle: React.ReactNode) => React.ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: isDragging ? ('relative' as const) : undefined,
    zIndex: isDragging ? 1 : undefined,
  }

  const dragHandle = (
    <button
      ref={setActivatorNodeRef}
      {...listeners}
      {...attributes}
      type="button"
      className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors touch-none flex-shrink-0 p-0.5"
      aria-label="Drag to reorder"
    >
      <GripIcon />
    </button>
  )

  return (
    <div ref={setNodeRef} style={style}>
      {children(dragHandle)}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ContentBlocksEditor({ hubId, hubTitle, templateId }: { hubId: string; hubTitle?: string; templateId?: string }) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [pickingType, setPickingType] = useState(false)
  const [addingType, setAddingType] = useState<BlockType | null>(null)
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [savedBlockId, setSavedBlockId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/hub/${hubId}/content_blocks`)
      .then(r => r.json())
      .then(json => {
        const loaded: ContentBlock[] = json.content_blocks ?? []
        setBlocks(loaded)
        setLoading(false)
        // Auto-open the first block so the user can start filling it in immediately
        if (loaded.length > 0) setEditingBlockId(loaded[0].id)
      })
  }, [hubId])

  // After saving or closing, open the next block in sequence (or close all if last)
  function openNextBlock(id: string) {
    setBlocks(current => {
      const idx = current.findIndex(b => b.id === id)
      const next = current[idx + 1]
      setEditingBlockId(next?.id ?? null)
      return current
    })
  }

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

  async function updateBlock(id: string, data: object) {
    const res = await fetch(`/api/hub/${hubId}/content_blocks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    })
    const json = await res.json()
    if (!json.error) {
      setBlocks(prev => prev.map(b => b.id === id ? { ...b, data } : b))
      setSavedBlockId(id)
      setTimeout(() => setSavedBlockId(s => s === id ? null : s), 2500)
      openNextBlock(id)
    }
    return json
  }

  async function deleteBlock(id: string) {
    await fetch(`/api/hub/${hubId}/content_blocks/${id}`, { method: 'DELETE' })
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  async function moveBlock(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= blocks.length) return

    // Swap by array position, then normalize all sort_orders to 0,1,2,…
    // This heals gaps and duplicates so every subsequent move works correctly.
    const reordered = [...blocks]
    ;[reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]]
    const normalized = reordered.map((b, i) => ({ ...b, sort_order: i }))
    setBlocks(normalized)

    // PATCH only the blocks whose sort_order actually changed
    const changed = normalized.filter(
      nb => blocks.find(b => b.id === nb.id)?.sort_order !== nb.sort_order
    )
    await Promise.all(
      changed.map(b =>
        fetch(`/api/hub/${hubId}/content_blocks/${b.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: b.sort_order }),
        })
      )
    )
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = blocks.findIndex(b => b.id === active.id)
    const newIndex = blocks.findIndex(b => b.id === over.id)
    const reordered = arrayMove(blocks, oldIndex, newIndex)
    const normalized = reordered.map((b, i) => ({ ...b, sort_order: i }))
    setBlocks(normalized)
    const changed = normalized.filter(
      nb => blocks.find(b => b.id === nb.id)?.sort_order !== nb.sort_order
    )
    await Promise.all(
      changed.map(b =>
        fetch(`/api/hub/${hubId}/content_blocks/${b.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: b.sort_order }),
        })
      )
    )
  }

  if (loading) return <div className="text-sm text-gray-400">Loading…</div>

  return (
    <div className="space-y-3">
      {hubTitle && (
        <h2 className="text-base font-semibold text-gray-800 pb-1 border-b border-gray-100">{hubTitle}</h2>
      )}
      {/* Existing blocks */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
          {blocks.map((block, index) => {
            const d = block.data as any
            if (editingBlockId === block.id) {
              const close  = () => openNextBlock(block.id)
              const save   = (data: object) => updateBlock(block.id, data)
              const remove = async () => { await deleteBlock(block.id); setEditingBlockId(null) }
              return (
                <div key={block.id}>
                  {block.type === 'text'      && <TextForm      initialData={d} onSave={save} onClose={close} onRemove={remove} />}
                  {block.type === 'checklist' && <ChecklistForm initialData={d} templateId={templateId} onSave={save} onClose={close} onRemove={remove} />}
                  {block.type === 'image'     && <ImageForm     initialData={d} hubId={hubId} blockIndex={index} onSave={save} onClose={close} onRemove={remove} />}
                  {block.type === 'timeline'  && <TimelineForm  initialData={d} onSave={save} onClose={close} onRemove={remove} />}
                  {block.type === 'audio'     && <AudioForm     initialData={d} hubId={hubId} templateId={templateId} onSave={save} onClose={close} onRemove={remove} />}
                  {block.type === 'link'            && <LinkForm            initialData={d} onSave={save} onClose={close} onRemove={remove} />}
                  {block.type === 'phone'           && <PhoneForm           initialData={d} onSave={save} onClose={close} onRemove={remove} />}
                  {block.type === 'file'            && <FileForm            initialData={d} hubId={hubId} blockIndex={index} onSave={save} onClose={close} onRemove={remove} />}
                  {block.type === 'collection_menu' && <CollectionMenuForm  initialData={d} onSave={save} onClose={close} onRemove={remove} />}
                </div>
              )
            }
            const hasContent = blockHasContent(block)
            return (
              <SortableBlockRow key={block.id} id={block.id}>
                {dragHandle => (
                <div className={`flex items-center border rounded-xl px-3 py-3 gap-2 ${hasContent ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200'}`}>
                  {dragHandle}
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveBlock(index, 'up')}
                      className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-xs leading-none px-1 transition-colors"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={index === blocks.length - 1}
                      onClick={() => moveBlock(index, 'down')}
                      className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-xs leading-none px-1 transition-colors"
                    >
                      ▼
                    </button>
                  </div>
            <div className="min-w-0 flex-1 flex items-center gap-2">
              <span
                title={hasContent ? 'Has content' : 'Empty'}
                className={`flex-shrink-0 w-2 h-2 rounded-full ${hasContent ? 'bg-emerald-400' : 'border border-gray-300'}`}
              />
              <span className="text-sm text-gray-700 truncate">{blockSummary(block)}</span>
              <span className="text-[10px] text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 flex-shrink-0 leading-none">
                {BLOCK_TYPE_META[block.type as BlockType]?.label ?? block.type}
              </span>
            </div>
            {savedBlockId === block.id ? (
              <span className="text-xs text-green-600 font-medium flex-shrink-0 border border-green-200 bg-green-50 rounded px-2 py-1">
                ✓ Saved
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setEditingBlockId(block.id)}
                className="text-xs text-gray-400 hover:text-blue-500 border border-gray-200 hover:border-blue-300 rounded px-2 py-1 flex-shrink-0 transition-colors"
              >
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={() => deleteBlock(block.id)}
              className="text-gray-300 hover:text-red-400 text-xl flex-shrink-0 transition-colors leading-none"
            >
              ×
            </button>
                </div>
                )}
              </SortableBlockRow>
            )
          })}
          </div>
        </SortableContext>
      </DndContext>

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

      {addingType === 'text'      && <TextForm      onSave={d => saveBlock('text', d)}      onClose={() => setAddingType(null)} />}
      {addingType === 'checklist' && <ChecklistForm templateId={templateId} onSave={d => saveBlock('checklist', d)} onClose={() => setAddingType(null)} />}
      {addingType === 'image'     && <ImageForm     hubId={hubId} blockIndex={blocks.length} onSave={d => saveBlock('image', d)} onClose={() => setAddingType(null)} />}
      {addingType === 'timeline'  && <TimelineForm  onSave={d => saveBlock('timeline', d)}  onClose={() => setAddingType(null)} />}
      {addingType === 'audio'     && <AudioForm     hubId={hubId} templateId={templateId} onSave={d => saveBlock('audio', d)} onClose={() => setAddingType(null)} />}
      {addingType === 'link'            && <LinkForm           onSave={d => saveBlock('link', d)}            onClose={() => setAddingType(null)} />}
      {addingType === 'phone'           && <PhoneForm          onSave={d => saveBlock('phone', d)}           onClose={() => setAddingType(null)} />}
      {addingType === 'file'            && <FileForm           hubId={hubId} blockIndex={blocks.length} onSave={d => saveBlock('file', d)} onClose={() => setAddingType(null)} />}
      {addingType === 'collection_menu' && <CollectionMenuForm onSave={d => saveBlock('collection_menu', d)} onClose={() => setAddingType(null)} />}
    </div>
  )
}

// ── Shared form shell ─────────────────────────────────────────────────────────

function FormShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
      <p className="text-xs font-medium text-gray-600">{title}</p>
      {children}
    </div>
  )
}

// ── Save + Close action buttons ───────────────────────────────────────────────

function FormActions({ saving, disabled, onClose, onSubmit, onRemove }: {
  saving: boolean
  disabled?: boolean
  onClose: () => void
  onSubmit: () => void
  onRemove?: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onSubmit}
        disabled={saving || disabled}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
      >
        Close
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={saving}
          className="ml-auto text-sm text-red-400 hover:text-red-600 transition-colors"
        >
          Remove
        </button>
      )}
    </div>
  )
}

// ── Text form ─────────────────────────────────────────────────────────────────

function TextForm({ onSave, onClose, onRemove, initialData }: { onSave: (d: TextData) => Promise<any>; onClose: () => void; onRemove?: () => void; initialData?: TextData }) {
  const [label, setLabel] = useState(initialData?.label ?? '')
  const [text, setText] = useState(initialData?.text ?? '')
  const [date, setDate] = useState(initialData?.date ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!text.trim()) { setError('Text is required.'); return }
    setSaving(true)
    const res = await onSave({ label: label.trim(), text: text.trim(), date: date || undefined })
    if (res.error) { setError(res.error); setSaving(false) }
  }

  return (
    <FormShell title="Text / Note">
      <input
        type="text"
        value={label}
        onChange={e => setLabel(e.target.value)}
        placeholder="Label (optional) — e.g. Overview, Notes, Details"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Your text here…"
        rows={5}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 whitespace-nowrap">Date (optional)</label>
        <input
          type="date"
          value={date}
          title="Date (optional)"
          onChange={e => setDate(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <FormActions saving={saving} onClose={onClose} onSubmit={submit} onRemove={onRemove} />
    </FormShell>
  )
}

// ── Checklist form ────────────────────────────────────────────────────────────

function ChecklistForm({ onSave, onClose, onRemove, initialData, templateId }: { onSave: (d: ChecklistData) => Promise<any>; onClose: () => void; onRemove?: () => void; initialData?: ChecklistData; templateId?: string }) {
  const [label, setLabel] = useState(initialData?.label ?? '')
  const [items, setItems] = useState(initialData?.items?.length ? initialData.items : [{ id: uid(), text: '' }])
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
    <FormShell title="Checklist">
      <input
        type="text"
        value={label}
        onChange={e => setLabel(e.target.value)}
        placeholder={CHECKLIST_LABEL_PLACEHOLDER[templateId ?? 'default'] ?? CHECKLIST_LABEL_PLACEHOLDER.default}
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
      <FormActions saving={saving} onClose={onClose} onSubmit={submit} onRemove={onRemove} />
    </FormShell>
  )
}

// ── Image form ────────────────────────────────────────────────────────────────

function ImageForm({ hubId, blockIndex, onSave, onClose, onRemove, initialData }: { hubId: string; blockIndex: number; onSave: (d: ImageData) => Promise<any>; onClose: () => void; onRemove?: () => void; initialData?: ImageData }) {
  const [caption, setCaption] = useState(initialData?.caption ?? '')
  const [url, setUrl] = useState(initialData?.url ?? '')
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
    <FormShell title="Image">
      <div className="space-y-2">
        <p className="text-xs text-gray-500">Upload or paste a URL</p>
        <input
          type="file"
          accept="image/*"
          title="Upload image"
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
      <FormActions saving={saving} disabled={uploading} onClose={onClose} onSubmit={submit} onRemove={onRemove} />
    </FormShell>
  )
}

// ── Timeline form ─────────────────────────────────────────────────────────────

function TimelineForm({ onSave, onClose, onRemove, initialData }: { onSave: (d: TimelineData) => Promise<any>; onClose: () => void; onRemove?: () => void; initialData?: TimelineData }) {
  const [label, setLabel] = useState(initialData?.label ?? '')
  const [events, setEvents] = useState(initialData?.events?.length ? initialData.events : [{ id: uid(), date: '', text: '' }])
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
    <FormShell title="Timeline">
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
              type="date"
              value={event.date}
              title="Event date"
              onChange={e => updateEvent(event.id, 'date', e.target.value)}
              className="w-36 flex-shrink-0 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <FormActions saving={saving} onClose={onClose} onSubmit={submit} onRemove={onRemove} />
    </FormShell>
  )
}

// ── Audio form ────────────────────────────────────────────────────────────────

const AUDIO_SUGGESTIONS: Record<string, string[]> = {
  ritual:      ['Intention', 'Sacred Space', 'In the Moment', 'Signs & Synchronicities', 'Ritual Reflection', 'Messages Received', 'Things to Revisit', 'Shadow Work'],
  recipe:      ['Cooking Notes', 'Technique Tips', 'Family Story', 'Recipe Memory', 'Tasting Notes', 'How I Make It'],
  artwork:     ['Artist Statement', 'Process Notes', 'Inspiration', 'What This Means to Me', 'Studio Notes', 'Behind the Work'],
  box:         ['Box Overview', 'What I Found', 'Storage Notes', 'Condition Notes', 'When I Packed This'],
  plant:       ['Plant Update', 'Growth Notes', 'Care Reminder', 'Seasonal Update', 'What I Noticed'],
  maintenance: ['Repair Notes', 'Inspection Update', 'Issue Report', 'What Was Fixed', 'Next Steps'],
  travel:      ['Travel Reflection', 'Day Highlights', 'Place Review', 'Trip Memory', 'What I Would Do Differently'],
  pet:         ['Pet Update', 'Vet Visit Notes', 'Behavior Notes', 'Training Progress', 'Funny Moment'],
  book:        ['Reading Reflection', 'Book Review', 'Favorite Passage', 'Character Notes', 'What Stayed With Me'],
  goal:        ['Progress Update', 'Weekly Review', 'Wins & Lessons', 'Motivation Check-in', 'What I Learned'],
  journal:     ['Voice Reflection', 'Evening Wind-Down', 'Gratitude', 'What I Want to Release', 'Closing Thought'],
  diary:       ['Voice Diary Entry', 'Memory from Today', 'End of Day', 'Quick Thought', 'What Made Me Laugh', "Something I Don't Want to Forget"],
  shadow_work: ['Voice Reflection', "What I'm Sitting With", 'Inner Dialogue', "What I'm Releasing", 'Compassion Note', 'Closing Insight'],
  garden:      ['Quick Garden Observation', 'What I Noticed', 'Pest or Disease Note', 'Harvest Note', 'Seasonal Update'],
  grocery:     ['Shopping Reminder', 'Brand Note', 'What We Ran Out Of'],
  packing:     ['Packing Reminder', 'Last-Minute Note', 'What I Forgot', 'Trip Note'],
  vehicle:     ['Repair Note', 'What the Mechanic Said', 'Sound or Issue', 'Mileage Note'],
  workout:     ['Post-Workout Note', 'Form Reminder', 'PR Celebration', 'How It Went', 'What to Adjust Next Time'],
  default:     ['Introduction', 'Overview', 'Notes', 'Story', 'Reflection', 'Tips & Ideas'],
}

const CHECKLIST_LABEL_PLACEHOLDER: Record<string, string> = {
  ritual:      'Label — e.g. Ritual Setup',
  recipe:      'Label — e.g. Prep Checklist',
  artwork:     'Label — e.g. Materials List',
  box:         'Label — e.g. Contents',
  plant:       'Label — e.g. Care Checklist',
  maintenance: 'Label — e.g. Maintenance Tasks',
  travel:      'Label — e.g. Packing List',
  pet:         'Label — e.g. Care Tasks',
  book:        'Label — e.g. Reading Goals',
  goal:        'Label — e.g. Habit Checklist',
  journal:     'Label — e.g. Daily Intentions',
  diary:       'Label — e.g. Things to Remember',
  shadow_work: 'Label — e.g. Release Checklist, Action Steps',
  garden:      'Label — e.g. Planting List, Garden Tasks',
  grocery:     'Label — e.g. Produce, Pantry',
  packing:     'Label — e.g. Essentials, Clothing',
  vehicle:     'Label — e.g. Routine Maintenance',
  workout:     'Label — e.g. Warmup, Workout Exercises',
  default:     'Label — e.g. Steps to Complete',
}

function formatTime(s: number) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }

function AudioForm({ hubId, templateId, onSave, onClose, onRemove, initialData }: { hubId: string; templateId?: string; onSave: (d: AudioData) => Promise<any>; onClose: () => void; onRemove?: () => void; initialData?: AudioData }) {
  const [mode, setMode] = useState<'record' | 'upload'>('record')
  const [label, setLabel] = useState(initialData?.label ?? '')
  const [date, setDate] = useState(initialData?.date ?? '')
  const [existingUrl] = useState(initialData?.url ?? '')
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
      // iOS Safari supports audio/mp4; Chrome/Firefox support audio/webm
      const mimeType = ['audio/mp4', 'audio/webm', 'audio/ogg'].find(
        t => MediaRecorder.isTypeSupported(t)
      ) ?? ''
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorderRef.current = recorder
      chunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        setRecordedBlob(blob)
        setRecordedUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop())
      }
      recorder.start()
      setRecording(true)
      setRecordingTime(0)
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Microphone access denied. Allow microphone access in your browser settings and try again.')
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('No microphone found on this device.')
      } else if (err instanceof DOMException && (err.name === 'NotSupportedError' || err.name === 'SecurityError')) {
        setError('Recording is not supported in this browser. Try uploading a file instead.')
      } else {
        setError('Could not start recording. Try uploading a file instead.')
      }
    }
  }

  function stopRecording() {
    recorderRef.current?.stop()
    setRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  async function saveExisting() {
    if (!label.trim()) { setError('Please add a label.'); return }
    setSaving(true)
    const res = await onSave({ label: label.trim(), url: existingUrl, date: date || undefined })
    if (res.error) { setError(res.error); setSaving(false) }
  }

  async function save(file: Blob | File) {
    if (!label.trim()) { setError('Please add a label.'); return }
    setSaving(true)
    setError('')
    const { uploadAudio } = await import('@/lib/supabase/uploadAudio')
    const url = await uploadAudio(file, hubId)
    if (!url) { setError('Upload failed. Check the hub-audio bucket in Supabase.'); setSaving(false); return }
    const res = await onSave({ label: label.trim(), url, date: date || undefined })
    if (res.error) { setError(res.error); setSaving(false) }
  }

  return (
    <FormShell title="Voice Note">
      <div>
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Label — e.g. Ritual Reflection"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex flex-wrap gap-1 mt-1.5">
          {(AUDIO_SUGGESTIONS[templateId ?? 'default'] ?? AUDIO_SUGGESTIONS.default).map(s => (
            <button key={s} type="button" onClick={() => setLabel(s)} className="text-xs text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 hover:bg-blue-50 transition-colors">
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Date <span className="text-gray-400">(optional)</span></label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          title="Date of recording"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {existingUrl && !recordedUrl && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Current audio:</p>
          <audio src={existingUrl} controls className="w-full" />
          <button type="button" onClick={saveExisting} disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <p className="text-xs text-gray-400 text-center">— or replace audio —</p>
        </div>
      )}

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
        <input type="file" accept="audio/*" title="Upload audio file" disabled={saving}
          onChange={async e => { const f = e.target.files?.[0]; if (f) await save(f) }}
          className="block text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-200 file:text-sm file:text-gray-600 file:bg-white hover:file:bg-gray-50"
        />
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Close advances to next block without saving */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
        >
          Close
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={saving}
            className="ml-auto text-sm text-red-400 hover:text-red-600 transition-colors"
          >
            Remove
          </button>
        )}
      </div>
    </FormShell>
  )
}

// ── Link form ─────────────────────────────────────────────────────────────────

function LinkForm({ onSave, onClose, onRemove, initialData }: { onSave: (d: LinkData) => Promise<any>; onClose: () => void; onRemove?: () => void; initialData?: LinkData }) {
  const [label, setLabel] = useState(initialData?.label ?? '')
  const [url, setUrl] = useState(initialData?.url ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!url.trim()) { setError('URL is required.'); return }
    setSaving(true)
    const res = await onSave({ label: label.trim(), url: url.trim() })
    if (res.error) { setError(res.error); setSaving(false) }
  }

  return (
    <FormShell title="Link Button">
      <input
        type="text"
        value={label}
        onChange={e => setLabel(e.target.value)}
        placeholder="Button label — e.g. Visit Website"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="url"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="https://example.com"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <FormActions saving={saving} onClose={onClose} onSubmit={submit} onRemove={onRemove} />
    </FormShell>
  )
}

// ── Phone form ────────────────────────────────────────────────────────────────

function PhoneForm({ onSave, onClose, onRemove, initialData }: { onSave: (d: PhoneData) => Promise<any>; onClose: () => void; onRemove?: () => void; initialData?: PhoneData }) {
  const [label, setLabel] = useState(initialData?.label ?? '')
  const [phone, setPhone] = useState(initialData?.url ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!phone.trim()) { setError('Phone number is required.'); return }
    setSaving(true)
    const res = await onSave({ label: label.trim(), url: phone.trim() })
    if (res.error) { setError(res.error); setSaving(false) }
  }

  return (
    <FormShell title="Phone Number">
      <input
        type="text"
        value={label}
        onChange={e => setLabel(e.target.value)}
        placeholder="Button label — e.g. Call Us"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="tel"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        placeholder="555-123-4567"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <FormActions saving={saving} onClose={onClose} onSubmit={submit} onRemove={onRemove} />
    </FormShell>
  )
}

// ── Collection menu form ──────────────────────────────────────────────────────

function CollectionMenuForm({ onSave, onClose, onRemove, initialData }: {
  onSave: (d: CollectionMenuData) => Promise<any>
  onClose: () => void
  onRemove?: () => void
  initialData?: CollectionMenuData
}) {
  const [collectionId, setCollectionId] = useState(initialData?.collection_id ?? '')
  const [excludedIds, setExcludedIds] = useState<string[]>(initialData?.excluded_hub_ids ?? [])
  const [collections, setCollections] = useState<{ id: string; title: string }[]>([])
  const [hubs, setHubs] = useState<{ id: string; title: string; privacy_mode: string }[]>([])
  const [loadingCollections, setLoadingCollections] = useState(true)
  const [loadingHubs, setLoadingHubs] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('collections')
        .select('id, title')
        .eq('user_id', user.id)
        .order('title')
      setCollections(data ?? [])
      setLoadingCollections(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!collectionId) { setHubs([]); return }
    setLoadingHubs(true)
    async function load() {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data } = await supabase
        .from('hubs')
        .select('id, title, privacy_mode')
        .eq('collection_id', collectionId)
        .order('title')
      setHubs(data ?? [])
      setLoadingHubs(false)
    }
    load()
  }, [collectionId])

  function toggleExclude(id: string) {
    setExcludedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function submit() {
    if (!collectionId) { setError('Please select a collection.'); return }
    setSaving(true)
    const res = await onSave({ collection_id: collectionId, excluded_hub_ids: excludedIds })
    if (res?.error) { setError(res.error); setSaving(false) }
  }

  return (
    <FormShell title="Hub Collector">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Collection</label>
        <select
          value={collectionId}
          onChange={e => { setCollectionId(e.target.value); setExcludedIds([]) }}
          disabled={loadingCollections}
          title="Select collection"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{loadingCollections ? 'Loading…' : 'Select a collection…'}</option>
          {collections.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {collectionId && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">
            {loadingHubs ? 'Loading hubs…' : 'Visible hubs — uncheck to hide from the public menu'}
          </p>
          {!loadingHubs && hubs.length === 0 && (
            <p className="text-sm text-gray-400 italic">No hubs in this collection yet.</p>
          )}
          {!loadingHubs && hubs.map(hub => (
            <label key={hub.id} className="flex items-start gap-2.5 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={!excludedIds.includes(hub.id)}
                onChange={() => toggleExclude(hub.id)}
                className="mt-0.5 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 flex-1">{hub.title}</span>
              {hub.privacy_mode === 'private' && (
                <span className="text-xs text-amber-500 mt-0.5 flex-shrink-0">private — won&apos;t show publicly</span>
              )}
              {hub.privacy_mode === 'unlisted' && (
                <span className="text-xs text-gray-400 mt-0.5 flex-shrink-0">unlisted</span>
              )}
            </label>
          ))}
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
      <FormActions saving={saving} onClose={onClose} onSubmit={submit} onRemove={onRemove} />
    </FormShell>
  )
}

// ── File form ─────────────────────────────────────────────────────────────────

function FileForm({ hubId, blockIndex, onSave, onClose, onRemove, initialData }: { hubId: string; blockIndex: number; onSave: (d: FileData) => Promise<any>; onClose: () => void; onRemove?: () => void; initialData?: FileData }) {
  const [label, setLabel] = useState(initialData?.label ?? '')
  const [url, setUrl] = useState(initialData?.url ?? '')
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
    if (!url.trim()) { setError('Please upload a file first.'); return }
    setSaving(true)
    const res = await onSave({ label: label.trim(), url: url.trim() })
    if (res.error) { setError(res.error); setSaving(false) }
  }

  return (
    <FormShell title="File / PDF">
      <input
        type="text"
        value={label}
        onChange={e => setLabel(e.target.value)}
        placeholder="Button label — e.g. Care Instructions PDF"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="space-y-2">
        <input
          type="file"
          accept="application/pdf,image/*,.doc,.docx"
          title="Upload file"
          disabled={uploading}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
          className="block text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-200 file:text-sm file:text-gray-600 file:bg-white hover:file:bg-gray-50"
        />
        {uploading && <p className="text-xs text-gray-400">Uploading…</p>}
        {url && !uploading && <p className="text-xs text-green-600">{url === initialData?.url ? 'Current file will be kept.' : 'File uploaded successfully.'}</p>}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <FormActions saving={saving} disabled={uploading || !url} onClose={onClose} onSubmit={submit} onRemove={onRemove} />
    </FormShell>
  )
}
