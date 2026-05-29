import Link from 'next/link'
import SiteFooter from '@/components/SiteFooter'

export default function ContentLicensingPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F7] flex flex-col">
      <header className="bg-white border-b border-stone-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Dashboard
          </Link>
          <h1 className="text-base font-semibold text-stone-900">Content Ownership &amp; Licensing FAQ</h1>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-5 py-10">
        <div className="space-y-8 text-sm text-stone-600 leading-[1.75]">

          <QA question="Do I own my Hubs, Collections, and content?">
            <p>Yes.</p>
            <p>
              Users retain ownership of the content they create within HubCollector™, including:
            </p>
            <ul>
              <li>Hubs,</li>
              <li>Collections,</li>
              <li>notes,</li>
              <li>text,</li>
              <li>images,</li>
              <li>files,</li>
              <li>links,</li>
              <li>playlists,</li>
              <li>and other user-generated content.</li>
            </ul>
          </QA>

          <QA question="Does HubCollector claim ownership of my content?">
            <p>No.</p>
            <p>HubCollector does not claim ownership of user-created content.</p>
            <p>However, by using the platform, you grant us a limited license to:</p>
            <ul>
              <li>host,</li>
              <li>store,</li>
              <li>display,</li>
              <li>process,</li>
              <li>and transmit your content solely for the purpose of operating, maintaining, and improving the Service.</li>
            </ul>
            <p>
              This license ends when your content is deleted from the platform, subject to reasonable
              backup and system retention periods.
            </p>
          </QA>

          <QA question="Can other users see my content?">
            <p>Only if you intentionally share it or make it public.</p>
            <p>Some features may allow:</p>
            <ul>
              <li>Shared Hubs,</li>
              <li>public links,</li>
              <li>collaborative Collections,</li>
              <li>or QR-code-accessible pages.</li>
            </ul>
            <p>Users are responsible for understanding what content they share publicly.</p>
          </QA>

          <QA question="Can HubCollector use my content for marketing?">
            <p>We will not publicly display or use your private content for marketing without permission.</p>
            <p>We may use:</p>
            <ul>
              <li>anonymized analytics,</li>
              <li>screenshots shared with permission,</li>
              <li>or voluntarily submitted testimonials.</li>
            </ul>
          </QA>

          <QA question="What happens if I delete my content?">
            <p>
              Deleted content may remain temporarily in backups or system logs for operational and
              security purposes before permanent removal.
            </p>
          </QA>

          <QA question="Can I export my content?">
            <p>Export features may be added over time.</p>
            <p>We encourage users to maintain backups of important information.</p>
          </QA>

          <QA question="Who owns the HubCollector platform itself?">
            <p>HubCollector, including:</p>
            <ul>
              <li>software,</li>
              <li>branding,</li>
              <li>interface design,</li>
              <li>logos,</li>
              <li>and platform functionality,</li>
            </ul>
            <p>is owned by cTaylor Consulting LLC dba Websketching.</p>
          </QA>

          <QA question="Does using AI-assisted tools affect ownership?">
            <p>
              Users retain ownership of the content they create and organize within HubCollector.
            </p>
            <p>
              The platform may incorporate AI-assisted features or development tools internally,
              but ownership of user-created content remains with the user.
            </p>
            <p className="text-stone-400 text-xs mt-4">
              © 2026 cTaylor Consulting LLC dba Websketching. All rights reserved.
            </p>
          </QA>

        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

function QA({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-stone-800 mb-3">{question}</h2>
      <div className="space-y-3 [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:list-disc [&_ul]:marker:text-stone-300">
        {children}
      </div>
    </section>
  )
}
