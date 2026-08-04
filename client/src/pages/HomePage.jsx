import React from 'react';

function Section({ title, children }) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-blue-100">{title}</h2>
      {children}
    </section>
  );
}

function Pill({ children }) {
  return (
    <span className="inline-block bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-4 py-1.5 text-sm font-medium">
      {children}
    </span>
  );
}

function LinkCard({ href, label, description, icon }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-4 p-5 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
    >
      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors text-blue-600">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{label}</p>
        <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 ml-auto flex-shrink-0 mt-1 transition-colors"
        fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

export default function HomePage({ isLoggedIn, user, onLoginClick, onStartChat }) {
  return (
    <div className="flex-1 overflow-y-auto bg-white">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-white text-sm font-semibold">Ewing's Sarcoma AI</span>
        </div>
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <span className="text-slate-400 text-xs hidden sm:block">{user?.email}</span>
              <button
                onClick={onStartChat}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Open Chat
              </button>
            </>
          ) : (
            <button
              onClick={onLoginClick}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 px-8 py-14 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-blue-300 text-xs font-medium tracking-wide uppercase">XIT Foundation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-snug mb-5">
            Curing Ewing's Sarcoma.<br />
            <span className="text-blue-400">Not just managing it.</span>
          </h1>
          <blockquote className="text-slate-300 text-base sm:text-lg italic leading-relaxed max-w-2xl mx-auto mb-8">
            "Curing human beings from devastating disease should be done. Because it must be done.
            Because it can be done. Because lifesaving therapy belongs to humanity."
            <span className="block text-blue-400 not-italic font-semibold mt-2 text-sm">— XIT Foundation</span>
          </blockquote>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="https://www.xit.org" target="_blank" rel="noopener noreferrer"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors shadow-md">
              Visit XIT.org
            </a>
            {isLoggedIn ? (
              <button
                onClick={onStartChat}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Open AI Chat
              </button>
            ) : (
              <button
                onClick={onLoginClick}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Sign In to Chat
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 py-12">

        <Section title="About XIT">
          <p className="text-gray-600 leading-relaxed mb-4">
            The <strong className="text-gray-800">XIT Foundation</strong> is a nonprofit organization with a singular mandate: to fund and support the
            pursuit of <em>cures</em> for childhood cancer — starting with Ewing's sarcoma. XIT's mission isn't to manage
            the disease; it's to cure it.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            XIT holds itself to a strict single filter — it funds only work aimed at curing the disease,
            not slowing it. That focus draws the foundation to the frontier of genetic medicine:
            gene editing, CRISPR, and nucleic-acid therapies designed to correct cancer at its source.
          </p>
          <div className="flex flex-wrap gap-2">
            {['Gene Editing', 'CRISPR Research', 'Nucleic-Acid Therapies', 'Pediatric Cancer', 'Curative Science'].map(t => (
              <Pill key={t}>{t}</Pill>
            ))}
          </div>
        </Section>

        <Section title="Project X-IT">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-5">
            <p className="text-gray-700 leading-relaxed mb-4">
              XIT Foundation is working to establish a <strong className="text-gray-900">philanthropically funded research
              laboratory in Texas</strong> — designed for one purpose: to help bridge scientific breakthrough and patient access.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              The lab is built to empower scientists, researchers, and engineers to apply
              <strong className="text-gray-900"> individualized nucleic-acid engineering</strong> to pediatric cancer —
              and to make the results of that work available <em>in the public interest</em>.
            </p>
            <p className="text-gray-700 leading-relaxed">
              The goal is to discover and develop curative therapies <strong className="text-gray-900">pro bono</strong>,
              bypassing profit barriers, so that breakthroughs can reach every child who needs them — at no cost to their families.
            </p>
          </div>
          <p className="text-sm text-gray-500 mb-4">XIT is forging partnerships with:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              'Clinical Oncologists & Principal Investigators',
              'Translational Researchers',
              'Regulatory Architects',
              'University Tech Transfer Offices',
              'Bioinformatics & AI Specialists',
            ].map(p => (
              <div key={p} className="flex items-center gap-2 text-sm text-gray-700">
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {p}
              </div>
            ))}
          </div>
        </Section>

        <Section title="How to Help">
          <div className="space-y-3">
            <LinkCard
              href="https://www.xit.org/donate"
              label="Donate to XIT"
              description="Every dollar funds curative science. XIT doesn't care who cures it first — only that it is cured."
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
            />
            <LinkCard
              href="https://www.xit.org/contact-xit"
              label="Host a Fundraising Event"
              description="Organize a community event, dedicate a birthday, or host a gala — every dollar accelerates the cure."
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            />
            <LinkCard
              href="https://www.xit.org/contact-xit"
              label="Corporate Matching & Partnerships"
              description="Double your impact through employer matching, or reach out to explore a formal partnership with XIT."
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
            />
            <LinkCard
              href="https://www.xit.org/shop"
              label="XIT Merch Shop"
              description="Wear something that changes everything. Every purchase supports the mission."
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
            />
            <LinkCard
              href="https://www.xit.org/projectxit"
              label="Learn About Project X-IT"
              description="Read about the philanthropically funded lab XIT is building to advance curative science."
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
            />
          </div>
        </Section>

        {/* Footer note */}
        <div className="border-t border-gray-100 pt-8 text-center">
          <p className="text-sm text-gray-400 leading-relaxed">
            This AI assistant was built to support Ewing's sarcoma patients and families.
            XIT Foundation content is sourced from{' '}
            <a href="https://www.xit.org" target="_blank" rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 underline">xit.org</a>.
            All rights reserved by XIT Foundation © 2026.
          </p>
        </div>
      </div>
    </div>
  );
}
