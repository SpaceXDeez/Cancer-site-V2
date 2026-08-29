import React from 'react';

function Step({ number, title, description }) {
  return (
    <div className="flex gap-4">
      <div className="w-9 h-9 rounded-full bg-brand-teal text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <p className="font-semibold text-brand-text-dark mb-1">{title}</p>
        <p className="text-sm text-[#5a7a8a] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function CapabilityCard({ icon, title, description }) {
  return (
    <div className="flex gap-3 p-4 rounded-xl border border-brand-border bg-white/70">
      <div className="w-8 h-8 rounded-lg bg-brand-teal-light flex items-center justify-center text-brand-teal flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-medium text-brand-text-dark text-sm mb-0.5">{title}</p>
        <p className="text-xs text-[#5a7a8a] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function HomePage({ isLoggedIn, user, onLoginClick, onStartChat }) {
  return (
    <div className="flex-1 overflow-y-auto bg-brand-cream">
      {/* Sticky top nav */}
      <div className="sticky top-0 z-10 bg-brand-cream/95 backdrop-blur-sm border-b border-brand-border px-4 py-2.5 flex items-center justify-between">
        <div className="pl-9 md:pl-0">
          <img src="/images/wordmark-wide.png" alt="Bell Guide" className="h-9 w-auto" />
        </div>
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <span className="text-[#6a8a9a] text-xs hidden sm:block">{user?.email}</span>
              <button
                onClick={onStartChat}
                className="px-4 py-1.5 bg-brand-teal hover:bg-brand-teal-dark text-white text-xs font-medium rounded-lg transition-colors"
              >
                Open Chat
              </button>
            </>
          ) : (
            <button
              onClick={onLoginClick}
              className="px-4 py-1.5 bg-brand-teal hover:bg-brand-teal-dark text-white text-xs font-medium rounded-lg transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Hero: banner graphic + tagline + CTA */}
      <div className="bg-brand-cream">
        <img
          src="/images/banner.jpg"
          alt="Bell Guide — Every question. Every step. A guide along your cancer journey."
          className="w-full object-contain max-h-[45vh] sm:max-h-[55vh]"
        />
        <div className="text-center py-8 px-4">
          <img
            src="/images/tagline.png"
            alt="Knowledge and support to the bell and beyond"
            className="h-7 sm:h-9 w-auto mx-auto mb-6 opacity-90"
          />
          {isLoggedIn ? (
            <button
              onClick={onStartChat}
              className="px-8 py-3.5 bg-brand-teal hover:bg-brand-teal-dark text-white text-sm font-semibold rounded-xl transition-colors shadow-lg"
            >
              Open AI Chat
            </button>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={onLoginClick}
                className="px-8 py-3.5 bg-brand-teal hover:bg-brand-teal-dark text-white text-sm font-semibold rounded-xl transition-colors shadow-lg"
              >
                Get Started — It&apos;s Free
              </button>
              <p className="text-xs text-[#8aacba]">No payment required &middot; Your data is private and encrypted</p>
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-brand-border to-transparent mx-6" />

      {/* Body */}
      <div className="max-w-3xl mx-auto px-5 py-12 space-y-14">

        {/* What is Bell Guide */}
        <section>
          <h2 className="text-2xl font-bold text-brand-teal-dark mb-4 pb-3 border-b-2 border-brand-teal-light">What is Bell Guide?</h2>
          <p className="text-[#3a5a6a] leading-relaxed mb-4">
            <strong className="text-brand-text-dark">Bell Guide</strong> is a free AI-powered companion for{' '}
            <strong className="text-brand-text-dark">Ewing&apos;s sarcoma</strong> patients, parents, and caregivers —
            built to help you navigate one of the most complex diagnoses in pediatric oncology with clarity and confidence.
          </p>
          <p className="text-[#3a5a6a] leading-relaxed">
            Ask questions about treatments, side effects, clinical trials, surgery, radiation, relapse options, and
            survivorship. When you fill out a patient profile, every response is tailored to your specific situation.
          </p>
        </section>

        {/* How it works */}
        <section>
          <h2 className="text-2xl font-bold text-brand-teal-dark mb-6 pb-3 border-b-2 border-brand-teal-light">How it works</h2>
          <div className="space-y-6">
            <Step
              number="1"
              title="Create a free account"
              description="Sign up with your email address. Your data is private and never shared. All conversations are encrypted and stored securely."
            />
            <Step
              number="2"
              title="Fill out a patient profile (optional)"
              description="Enter details about the patient's diagnosis, treatment history, and current status. The more context you provide, the more personalized and useful the AI's answers will be. Nothing is required — you can skip any field."
            />
            <Step
              number="3"
              title="Start a conversation"
              description="Ask the AI anything about Ewing's sarcoma. You can create multiple chat threads to organize different topics — side effects, upcoming appointments, clinical trial research, and more."
            />
          </div>
          {!isLoggedIn && (
            <button
              onClick={onLoginClick}
              className="mt-8 w-full sm:w-auto px-6 py-3 bg-brand-teal hover:bg-brand-teal-dark text-white text-sm font-semibold rounded-xl transition-colors shadow"
            >
              Create your free account →
            </button>
          )}
        </section>

        {/* What you can ask */}
        <section>
          <h2 className="text-2xl font-bold text-brand-teal-dark mb-6 pb-3 border-b-2 border-brand-teal-light">What you can ask</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CapabilityCard
              title="Chemotherapy & Side Effects"
              description="Understand VDC/IE regimens, dosing, and how to manage side effects from each drug."
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <CapabilityCard
              title="Clinical Trials"
              description="Find actively recruiting trials for Ewing's sarcoma, with NCT numbers and eligibility guidance."
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
            />
            <CapabilityCard
              title="Surgery & Radiation"
              description="Learn about limb-sparing surgery, amputation decisions, radiation modalities, and proton beam therapy."
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            />
            <CapabilityCard
              title="Relapse & Salvage Therapy"
              description="Understand options after relapse: GemDoc, irinotecan/temozolomide, regorafenib, cabozantinib, and more."
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
            />
            <CapabilityCard
              title="Understanding Scans & Reports"
              description="Decode PET/CT/MRI results, pathology reports, EWSR1 fusions, and treatment response terminology."
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            />
            <CapabilityCard
              title="Survivorship & Late Effects"
              description="Prepare for life after treatment: long-term monitoring, fertility preservation, and late-effect management."
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
            />
          </div>
        </section>

        {/* XIT Foundation */}
        <section>
          <h2 className="text-2xl font-bold text-brand-teal-dark mb-4 pb-3 border-b-2 border-brand-teal-light">XIT Foundation</h2>
          <div className="bg-white/60 border border-brand-border rounded-2xl p-6">
            <p className="text-[#3a5a6a] leading-relaxed mb-4">
              The <strong className="text-brand-text-dark">XIT Foundation</strong> is a nonprofit organization with one goal:
              to fund the pursuit of a <em>cure</em> for Ewing&apos;s sarcoma — not just better management of the disease.
              XIT funds only work aimed at curing Ewing&apos;s, drawing on the frontier of genetic medicine, gene editing,
              and nucleic-acid therapies.
            </p>
            <p className="text-[#3a5a6a] leading-relaxed mb-5">
              XIT has collaborated on the development of this application by giving feedback on the app, and plan to
              help spread the word about the app in the Ewing&apos;s community.
            </p>
            <a
              href="https://www.xit.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-teal hover:text-brand-teal-dark transition-colors"
            >
              Learn more at xit.org
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </section>

        {/* About */}
        <section>
          <h2 className="text-2xl font-bold text-brand-teal-dark mb-4 pb-3 border-b-2 border-brand-teal-light">About Bell Guide</h2>
          <div className="bg-gradient-to-br from-white/70 to-brand-teal-light/30 border border-brand-border rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <img
                src="/images/boy-bell-circle.png"
                alt=""
                className="w-24 h-24 rounded-full object-cover flex-shrink-0 mx-auto sm:mx-0 opacity-90"
              />
              <div>
                <p className="text-[#3a5a6a] leading-relaxed mb-4">
                  Bell Guide was built by <strong className="text-brand-text-dark">Dylan Rossi</strong>, an Ewing&apos;s sarcoma
                  survivor. Dylan built the app at 16, two years after completing his last treatment — with a single goal:
                  to help other families navigate their own fight with Ewing&apos;s sarcoma.
                </p>
                <p className="text-[#3a5a6a] leading-relaxed">
                  Dylan and his family have partnered with the <strong className="text-brand-text-dark">XIT Foundation</strong>{' '}
                  to spread the word about the app across the Ewing&apos;s community and gather feedback — because every family
                  deserves access to the best possible information.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <div className="border-t border-brand-border pt-8 text-center">
          <p className="text-sm text-[#7a9aaa] leading-relaxed max-w-xl mx-auto">
            <strong className="text-[#5a7a8a]">Important:</strong> Bell Guide is for educational purposes only.
            Nothing here constitutes medical advice. Always make treatment decisions in close partnership with your
            medical oncology team.
          </p>
          <p className="text-xs text-[#aac5d0] mt-3">
            Bell Guide &middot; In partnership with{' '}
            <a href="https://www.xit.org" target="_blank" rel="noopener noreferrer"
              className="text-brand-teal hover:text-brand-teal-dark transition-colors">XIT Foundation</a>{' '}
            &middot; &copy; 2026
          </p>
        </div>

      </div>
    </div>
  );
}

