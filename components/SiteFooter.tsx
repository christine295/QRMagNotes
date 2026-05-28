import Link from 'next/link'

export default function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={`border-t border-stone-100 ${className ?? ''}`}>
      <div className="max-w-2xl mx-auto px-5 py-6 flex flex-col items-center gap-2 text-[11px] text-stone-400 text-center">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <Link href="/privacy" className="hover:text-stone-600 transition-colors whitespace-nowrap">Privacy</Link>
          <span className="text-stone-200">·</span>
          <Link href="/terms" className="hover:text-stone-600 transition-colors whitespace-nowrap">Terms</Link>
          <span className="text-stone-200">·</span>
          <Link href="/acceptable-use" className="hover:text-stone-600 transition-colors whitespace-nowrap">Acceptable Use</Link>
          <span className="text-stone-200">·</span>
          <Link href="/content-licensing" className="hover:text-stone-600 transition-colors whitespace-nowrap">Licensing FAQ</Link>
        </div>
        <p className="text-stone-300 leading-relaxed">
          © 2026{' '}
          <a
            href="https://websketching.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-stone-500 transition-colors underline underline-offset-2"
          >
            Websketching
          </a>
          {' '}· All rights reserved.
        </p>
        <p className="text-stone-300">HubCollector™ is a trademark of cTaylor Consulting LLC.</p>
      </div>
    </footer>
  )
}
