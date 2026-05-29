import Link from 'next/link'
import SiteFooter from '@/components/SiteFooter'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F7] flex flex-col">
      <header className="bg-white border-b border-stone-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
            « Dashboard
          </Link>
          <h1 className="text-base font-semibold text-stone-900">Privacy Policy</h1>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-5 py-10">
        <p className="text-xs text-stone-400 mb-8">Effective Date: May 27, 2026</p>

        <div className="space-y-8 text-sm text-stone-600 leading-[1.75]">

          <p>
            HubCollector™, a product of Websketching, a DBA of cTaylor Consulting LLC
            (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;),
            respects your privacy.
          </p>
          <p>
            This Privacy Policy explains how we collect, use, and protect information when you use
            HubCollector (&ldquo;Service&rdquo;).
          </p>

          <Section title="1. Information We Collect">
            <p>We may collect:</p>
            <ul>
              <li>account information (such as email address and login credentials),</li>
              <li>User Content,</li>
              <li>usage analytics,</li>
              <li>device and browser information,</li>
              <li>and technical log data.</li>
            </ul>
            <p>
              If file uploads or media uploads are enabled, uploaded content may also be stored
              temporarily or permanently depending on platform functionality.
            </p>
          </Section>

          <Section title="2. How We Use Information">
            <p>We use information to:</p>
            <ul>
              <li>operate and maintain the Service,</li>
              <li>authenticate users,</li>
              <li>improve platform functionality,</li>
              <li>provide customer support,</li>
              <li>analyze usage trends,</li>
              <li>and protect platform security.</li>
            </ul>
            <p>
              We may also use aggregated, non-identifiable analytics to improve the platform.
            </p>
          </Section>

          <Section title="3. Sharing of Information">
            <p>We do not sell personal information.</p>
            <p>
              We may share information with trusted service providers involved in hosting, analytics,
              authentication, storage, infrastructure, or platform operations necessary to provide
              the Service.
            </p>
            <p>Information may also be disclosed:</p>
            <ul>
              <li>to comply with legal obligations,</li>
              <li>to enforce our Terms,</li>
              <li>or to protect the rights and safety of users or the platform.</li>
            </ul>
          </Section>

          <Section title="4. Public and Shared Content">
            <p>
              Some Hubs, Collections, QR codes, or shared links may be intentionally made accessible
              to others by users.
            </p>
            <p>
              Users are responsible for understanding the visibility and sharing settings of their
              Hubs and Collections.
            </p>
          </Section>

          <Section title="5. Data Storage and Security">
            <p>
              We use reasonable safeguards to protect user information, but no system can guarantee
              absolute security.
            </p>
            <p>
              Users should avoid storing highly sensitive personal, financial, or confidential
              information within the Service.
            </p>
          </Section>

          <Section title="6. Cookies and Analytics">
            <p>
              We may use cookies, local storage, analytics tools, and similar technologies to improve
              user experience and platform performance.
            </p>
          </Section>

          <Section title="7. Third-Party Services">
            <p>
              The Service may integrate with or link to third-party platforms such as Spotify,
              authentication providers, QR code services, analytics providers, or external websites.
            </p>
            <p>We are not responsible for the privacy practices of third-party services.</p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>The Service is not intended for children under 13.</p>
            <p>
              We do not knowingly collect personal information from children under 13.
            </p>
          </Section>

          <Section title="9. Your Rights">
            <p>
              Depending on your jurisdiction, you may have rights regarding access, correction, or
              deletion of your personal information.
            </p>
            <p>
              Requests may be submitted to:{' '}
              <a href="mailto:support@hubcollector.com" className="text-blue-600 hover:underline">
                support@hubcollector.com
              </a>
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>We may update this Privacy Policy periodically.</p>
            <p>
              Continued use of the Service after updates constitutes acceptance of the revised policy.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>HubCollector is a product of Websketching, a DBA of cTaylor Consulting LLC.</p>
            <p>
              For privacy-related questions:{' '}
              <a href="mailto:support@hubcollector.com" className="text-blue-600 hover:underline">
                support@hubcollector.com
              </a>
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
      <div className="space-y-3 [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:list-disc [&_ul]:marker:text-stone-300">
        {children}
      </div>
    </section>
  )
}
