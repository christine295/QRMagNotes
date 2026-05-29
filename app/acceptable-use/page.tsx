import Link from 'next/link'
import SiteFooter from '@/components/SiteFooter'

export default function AcceptableUsePage() {
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
          <h1 className="text-base font-semibold text-stone-900">Acceptable Use Policy</h1>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-5 py-10">
        <p className="text-xs text-stone-400 mb-8">Effective Date: May 27, 2026</p>

        <div className="space-y-8 text-sm text-stone-600 leading-[1.75]">

          <p>
            This Acceptable Use Policy (&ldquo;Policy&rdquo;) outlines permitted and prohibited uses
            of HubCollector™, a product of Websketching, a DBA of cTaylor Consulting LLC
            (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;).
          </p>
          <p>
            By using HubCollector (&ldquo;Service&rdquo;), you agree to follow this Policy.
          </p>

          <Section title="Permitted Use">
            <p>
              HubCollector is intended for lawful personal, creative, educational, organizational,
              and business use.
            </p>
            <p>Examples include:</p>
            <ul>
              <li>personal notes,</li>
              <li>Collections,</li>
              <li>household organization,</li>
              <li>creative archives,</li>
              <li>recipes,</li>
              <li>rituals,</li>
              <li>workouts,</li>
              <li>reference Hubs,</li>
              <li>and collaborative information sharing through Collections and Hubs.</li>
            </ul>
          </Section>

          <Section title="Prohibited Activities">
            <p>You may not use the Service to:</p>

            <Subsection title="Illegal Activity">
              <ul>
                <li>violate laws or regulations,</li>
                <li>promote illegal activity,</li>
                <li>or distribute unlawful material.</li>
              </ul>
            </Subsection>

            <Subsection title="Harmful Content">
              <ul>
                <li>upload malware, viruses, or malicious code,</li>
                <li>attempt unauthorized access,</li>
                <li>interfere with platform security,</li>
                <li>scrape or overload the Service,</li>
                <li>or abuse APIs or infrastructure.</li>
              </ul>
            </Subsection>

            <Subsection title="Harassment and Abuse">
              <ul>
                <li>harass, threaten, impersonate, or exploit others,</li>
                <li>distribute hateful or abusive content,</li>
                <li>or engage in stalking or intimidation.</li>
              </ul>
            </Subsection>

            <Subsection title="Intellectual Property Violations">
              <ul>
                <li>upload content you do not have rights to use,</li>
                <li>infringe copyrights or trademarks,</li>
                <li>or distribute pirated materials.</li>
              </ul>
            </Subsection>

            <Subsection title="Misleading or Fraudulent Use">
              <ul>
                <li>create deceptive QR codes or links,</li>
                <li>impersonate organizations or individuals,</li>
                <li>conduct phishing,</li>
                <li>or use the platform for scams or spam.</li>
              </ul>
            </Subsection>

            <Subsection title="Excessive or Automated Abuse">
              <ul>
                <li>use bots or automation to abuse the platform,</li>
                <li>create excessive resource usage,</li>
                <li>or attempt to disrupt normal operation.</li>
              </ul>
            </Subsection>
          </Section>

          <Section title="Shared and Public Hubs">
            <p>Users are responsible for:</p>
            <ul>
              <li>understanding whether a Hub, Collection, or link is public,</li>
              <li>controlling who receives shared QR codes,</li>
              <li>and ensuring shared content is appropriate.</li>
            </ul>
            <p>
              We are not responsible for how third parties access or distribute publicly shared
              Hubs, Collections, or links.
            </p>
          </Section>

          <Section title="Enforcement">
            <p>We reserve the right to:</p>
            <ul>
              <li>remove content,</li>
              <li>limit functionality,</li>
              <li>suspend accounts,</li>
              <li>or terminate access for violations of this Policy or misuse of the platform.</li>
            </ul>
          </Section>

          <Section title="Reporting Violations">
            <p>
              To report abuse or suspicious activity, contact:{' '}
              <a href="mailto:support@hubcollector.com" className="text-blue-600 hover:underline">
                support@hubcollector.com
              </a>
            </p>
          </Section>

          <Section title="Changes">
            <p>This Policy may be updated periodically.</p>
            <p>
              Continued use of the Service after updates constitutes acceptance of the revised Policy.
            </p>
            <p className="text-stone-400 text-xs mt-4">
              © 2026 cTaylor Consulting LLC dba Websketching. All rights reserved.
            </p>
          </Section>

        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-stone-800 mb-3">{title}</h2>
      <div className="space-y-4 [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:list-disc [&_ul]:marker:text-stone-300">
        {children}
      </div>
    </section>
  )
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">{title}</h3>
      <div className="[&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:list-disc [&_ul]:marker:text-stone-300">
        {children}
      </div>
    </div>
  )
}
