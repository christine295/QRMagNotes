import Link from 'next/link'

export default function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={`border-t border-stone-100 ${className ?? ''}`}>
      <div className="max-w-2xl mx-auto px-5 py-5 flex flex-col items-center text-center">
        {/* Nav links — sit higher, more visual separation from copyright block */}
        <div className="flex items-center gap-2 flex-wrap justify-center mb-3 text-[11px] md:text-sm text-stone-500">
          <Link href="/explore" className="hover:text-stone-700 transition-colors whitespace-nowrap">Explore</Link>
          <span className="text-stone-300">·</span>
          <Link href="/privacy" className="hover:text-stone-700 transition-colors whitespace-nowrap">Privacy</Link>
          <span className="text-stone-300">·</span>
          <Link href="/terms" className="hover:text-stone-700 transition-colors whitespace-nowrap">Terms</Link>
          <span className="text-stone-300">·</span>
          <Link href="/acceptable-use" className="hover:text-stone-700 transition-colors whitespace-nowrap">Acceptable Use</Link>
          <span className="text-stone-300">·</span>
          <Link href="/content-licensing" className="hover:text-stone-700 transition-colors whitespace-nowrap">Licensing FAQ</Link>
        </div>
        {/* Copyright block — slightly smaller/lighter, tighter line height */}
        <div className="text-[10px] md:text-xs text-stone-400 leading-snug space-y-0.5">
          <p>HubCollector™ is a trademark of cTaylor Consulting LLC.</p>
          <p>
            © 2026{' '}
            <a
              href="https://websketching.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-stone-600 transition-colors underline underline-offset-2"
            >
              Websketching
            </a>
            {' '}· All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
