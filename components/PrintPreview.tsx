'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Hub } from '@/lib/types'
import QRCode from 'qrcode'

type Template = 'label' | 'standard' | 'creator'

const TEMPLATES: { id: Template; label: string; description: string }[] = [
  { id: 'standard', label: 'Standard Card', description: 'Themed header, QR, URL' },
  { id: 'label',    label: 'Simple Label',  description: 'Compact — QR + title' },
  { id: 'creator',  label: 'Creator Card',  description: 'Image-forward layout' },
]

export default function PrintPreview({ hub, username }: { hub: Hub; username: string }) {
  const [template, setTemplate] = useState<Template>('standard')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const hubUrl = `${siteUrl}/h/${username}/${hub.slug}`
  const color = hub.theme_color ?? '#3B82F6'

  useEffect(() => {
    QRCode.toDataURL(hubUrl, { width: 400, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
      .then(setQrDataUrl)
  }, [hubUrl])

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none; }
          .print-root { display: block !important; }
          .print-hide { display: none !important; }
          .print-card { box-shadow: none !important; }
          @page { margin: 0.5in; size: auto; }
        }
      `}</style>

      <div className="print-root min-h-screen bg-gray-100">
        {/* Header */}
        <div className="print-hide bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <Link
              href={`/dashboard/hub/${hub.id}/edit`}
              className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
            >
              ← Back
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Print Card</h1>
          </div>
        </div>

        {/* Controls */}
        <div className="print-hide max-w-2xl mx-auto px-4 py-6 space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Template</p>
            <div className="flex gap-2 flex-wrap">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplate(t.id)}
                  className={`border rounded-lg px-4 py-2 text-left transition-colors ${
                    template === t.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className={`text-sm font-medium ${template === t.id ? 'text-blue-700' : 'text-gray-700'}`}>
                    {t.label}
                  </div>
                  <div className="text-xs text-gray-400">{t.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Print / Save as PDF
            </button>
            <p className="text-xs text-gray-400">
              Your browser will offer print or save-as-PDF options.
            </p>
          </div>
        </div>

        {/* Card preview */}
        <div className="max-w-2xl mx-auto px-4 pb-16 flex justify-start">
          <div>
            <p className="print-hide text-xs text-gray-400 mb-3 uppercase tracking-wide">Preview</p>
            {template === 'standard' && (
              <StandardCard hub={hub} qrDataUrl={qrDataUrl} hubUrl={hubUrl} color={color} />
            )}
            {template === 'label' && (
              <LabelCard hub={hub} qrDataUrl={qrDataUrl} hubUrl={hubUrl} color={color} />
            )}
            {template === 'creator' && (
              <CreatorCard hub={hub} qrDataUrl={qrDataUrl} hubUrl={hubUrl} color={color} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

type CardProps = { hub: Hub; qrDataUrl: string; hubUrl: string; color: string }

// ─── Standard Card ────────────────────────────────────────────────────────────

function StandardCard({ hub, qrDataUrl, hubUrl, color }: CardProps) {
  return (
    <div
      className="print-card"
      style={{
        width: '3.5in',
        borderRadius: '10px',
        overflow: 'hidden',
        backgroundColor: '#fff',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Colored header */}
      <div style={{ backgroundColor: color, padding: '16px 18px' }}>
        {hub.image_url && (
          <img
            src={hub.image_url}
            alt=""
            style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', marginBottom: '8px' }}
          />
        )}
        <div style={{ fontWeight: 700, fontSize: '16px', color: '#fff', lineHeight: 1.2 }}>
          {hub.title}
        </div>
        {hub.description && (
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', marginTop: '5px', lineHeight: 1.4 }}>
            {hub.description}
          </div>
        )}
      </div>

      {/* QR section */}
      <div style={{ padding: '16px', textAlign: 'center' }}>
        {qrDataUrl && (
          <img
            src={qrDataUrl}
            alt="QR code"
            style={{ width: '140px', height: '140px', display: 'block', margin: '0 auto 10px' }}
          />
        )}
        <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', letterSpacing: '0.05em' }}>
          SCAN TO VIEW
        </div>
        <div style={{ fontSize: '8.5px', color: '#9ca3af', fontFamily: 'monospace', wordBreak: 'break-all' }}>
          {hubUrl}
        </div>
      </div>
    </div>
  )
}

// ─── Simple Label ─────────────────────────────────────────────────────────────

function LabelCard({ hub, qrDataUrl, hubUrl, color }: CardProps) {
  return (
    <div
      className="print-card"
      style={{
        width: '3.5in',
        borderRadius: '8px',
        border: `2px solid ${color}`,
        backgroundColor: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {qrDataUrl && (
        <img
          src={qrDataUrl}
          alt="QR code"
          style={{ width: '80px', height: '80px', flexShrink: 0 }}
        />
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '14px', color: color, lineHeight: 1.2, marginBottom: '3px', wordBreak: 'break-word' }}>
          {hub.title}
        </div>
        {hub.description && (
          <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '5px', lineHeight: 1.3 }}>
            {hub.description}
          </div>
        )}
        <div style={{ fontSize: '8.5px', color: '#9ca3af', fontFamily: 'monospace', wordBreak: 'break-all' }}>
          {hubUrl}
        </div>
      </div>
    </div>
  )
}

// ─── Creator / Artist Card ────────────────────────────────────────────────────

function CreatorCard({ hub, qrDataUrl, hubUrl, color }: CardProps) {
  return (
    <div
      className="print-card"
      style={{
        width: '4in',
        borderRadius: '10px',
        overflow: 'hidden',
        backgroundColor: '#fff',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Image or color band */}
      {hub.image_url ? (
        <img
          src={hub.image_url}
          alt=""
          style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{ height: '70px', backgroundColor: color }} />
      )}

      {/* Content */}
      <div style={{ padding: '16px 18px' }}>
        <div style={{ fontWeight: 700, fontSize: '18px', color: '#111827', lineHeight: 1.2, marginBottom: '6px' }}>
          {hub.title}
        </div>
        {hub.description && (
          <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5, marginBottom: '14px' }}>
            {hub.description}
          </div>
        )}

        {/* QR row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt="QR code"
              style={{ width: '90px', height: '90px', flexShrink: 0 }}
            />
          )}
          <div>
            <div style={{ fontSize: '11px', color: color, fontWeight: 600, marginBottom: '4px' }}>
              Scan to explore
            </div>
            <div style={{ fontSize: '8.5px', color: '#9ca3af', fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.4 }}>
              {hubUrl}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
