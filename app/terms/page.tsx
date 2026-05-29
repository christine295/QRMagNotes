import Link from 'next/link'
import SiteFooter from '@/components/SiteFooter'

export default function TermsPage() {
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
          <h1 className="text-base font-semibold text-stone-900">Terms of Service</h1>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-5 py-10">
        <p className="text-xs text-stone-400 mb-8">Effective Date: May 27, 2026</p>

        <div className="prose-legal space-y-8 text-sm text-stone-600 leading-[1.75]">

          <p>
            Welcome to HubCollector™, a product of Websketching, a DBA of cTaylor Consulting LLC
            (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;).
          </p>
          <p>
            By accessing or using HubCollector (&ldquo;Service&rdquo;), you agree to these Terms of Service
            (&ldquo;Terms&rdquo;). If you do not agree, please do not use the Service.
          </p>

          <Section title="1. Description of Service">
            <p>
              HubCollector allows users to create, organize, manage, and share digital Hubs, Collections,
              notes, links, media, files, and related content accessible through QR codes, URLs, and mobile devices.
            </p>
            <p>Features and functionality may evolve over time as the platform develops.</p>
          </Section>

          <Section title="2. Eligibility">
            <p>You must be at least 13 years old to use the Service.</p>
            <p>By using the Service, you represent that:</p>
            <ul>
              <li>you can legally enter into this agreement,</li>
              <li>the information you provide is accurate,</li>
              <li>and you will use the Service in compliance with applicable laws.</li>
            </ul>
          </Section>

          <Section title="3. User Accounts">
            <p>You are responsible for:</p>
            <ul>
              <li>maintaining the security of your account,</li>
              <li>safeguarding your login credentials,</li>
              <li>and all activity occurring under your account.</li>
            </ul>
            <p>
              We are not liable for unauthorized access resulting from your failure to secure your
              account credentials.
            </p>
          </Section>

          <Section title="4. User Content">
            <p>
              You retain ownership of the content you create or upload to HubCollector, including Hubs,
              Collections, notes, text, images, files, links, playlists, and other materials
              (&ldquo;User Content&rdquo;).
            </p>
            <p>
              By submitting User Content, you grant us a limited, non-exclusive license to host, store,
              display, process, and transmit that content solely for the purpose of operating, maintaining,
              and improving the Service.
            </p>
            <p>You are solely responsible for your User Content.</p>
            <p>You agree not to upload or share content that:</p>
            <ul>
              <li>violates laws,</li>
              <li>infringes intellectual property rights,</li>
              <li>contains malware or malicious code,</li>
              <li>harasses or harms others,</li>
              <li>or contains illegal, abusive, or deceptive material.</li>
            </ul>
            <p>We reserve the right to remove content or suspend accounts at our discretion.</p>
          </Section>

          <Section title="5. Intellectual Property">
            <p>
              HubCollector, including its software, branding, design, logos, interface elements, and
              platform functionality, is owned by cTaylor Consulting LLC dba Websketching and protected
              by applicable intellectual property laws.
            </p>
            <p>You may not:</p>
            <ul>
              <li>copy,</li>
              <li>reverse engineer,</li>
              <li>redistribute,</li>
              <li>resell,</li>
              <li>or exploit the Service without written permission.</li>
            </ul>
          </Section>

          <Section title="6. QR Codes and Shared Links">
            <p>
              Users are responsible for any QR codes, public links, Shared Hubs, or shared Collections
              they distribute.
            </p>
            <p>We are not responsible for:</p>
            <ul>
              <li>how third parties use shared links,</li>
              <li>expired or modified links,</li>
              <li>or unintended sharing of personal information.</li>
            </ul>
            <p>Use caution when sharing public Hubs or Collections.</p>
          </Section>

          <Section title="7. Availability">
            <p>We do not guarantee uninterrupted access to the Service.</p>
            <p>Features may be modified, suspended, or discontinued at any time without notice.</p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, cTaylor Consulting LLC and its affiliates shall
              not be liable for:
            </p>
            <ul>
              <li>indirect,</li>
              <li>incidental,</li>
              <li>consequential,</li>
              <li>special,</li>
              <li>or punitive damages arising from use of the Service.</li>
            </ul>
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
              warranties of any kind.
            </p>
          </Section>

          <Section title="9. Data Loss">
            <p>
              While we may implement backups and safeguards, users are responsible for maintaining
              their own copies of important information.
            </p>
            <p>We are not responsible for lost data, deleted content, or interrupted access.</p>
          </Section>

          <Section title="10. Termination">
            <p>
              We may suspend or terminate access to the Service at any time for violations of these
              Terms or misuse of the platform.
            </p>
            <p>Users may stop using the Service at any time.</p>
          </Section>

          <Section title="11. Changes to These Terms">
            <p>We may update these Terms periodically.</p>
            <p>
              Continued use of the Service after updates constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="12. Contact">
            <p>HubCollector is a product of Websketching, a DBA of cTaylor Consulting LLC.</p>
            <p>
              For questions regarding these Terms, contact:{' '}
              <a
                href="mailto:support@hubcollector.com"
                className="text-blue-600 hover:underline"
              >
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
