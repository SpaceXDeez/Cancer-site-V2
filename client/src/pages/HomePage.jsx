import React from 'react';

function RibbonIcon() {
  return (
    <svg width="18" height="26" viewBox="0 0 18 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Loop */}
      <path d="M9 1C5.5 1 2.5 3.8 2.5 7.2C2.5 10 4.5 12.4 7.2 13.4L9 14L10.8 13.4C13.5 12.4 15.5 10 15.5 7.2C15.5 3.8 12.5 1 9 1Z" fill="#FCD34D"/>
      {/* Left tail */}
      <path d="M7.2 13.4L3 22L6.5 20L9 25L9 14L7.2 13.4Z" fill="#FCD34D"/>
      {/* Right tail */}
      <path d="M10.8 13.4L15 22L11.5 20L9 25L9 14L10.8 13.4Z" fill="#FCD34D"/>
    </svg>
  );
}

function Step({ number, title, description }) {
  return (
    <div className="flex gap-4">
      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <p className="font-semibold text-gray-900 mb-1">{title}</p>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function CapabilityCard({ icon, title, description }) {
  return (
    <div className="flex gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-medium text-gray-800 text-sm mb-0.5">{title}</p>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function HomePage({ isLoggedIn, user, onLoginClick, onStartChat }) {
  return (
    <div className="flex-1 overflow-y-auto bg-white">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 pl-8 md:pl-0">
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
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 px-6 py-14 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-blue-400 rounded-full" />
            <span className="text-blue-300 text-xs font-medium tracking-wide uppercase">In partnership with XIT Foundation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-snug mb-4">
            AI support for Ewing's sarcoma<br />
            <span className="text-blue-400">patients and families.</span>
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-8">
            Ask questions about treatments, side effects, clinical trials, and navigating care —
            powered by AI and shaped by the expertise of the Ewing's sarcoma community.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {isLoggedIn ? (
              <button
                onClick={onStartChat}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg"
              >
                Open AI Chat
              </button>
            ) : (
              <button
                onClick={onLoginClick}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg"
              >
                Get Started — It's Free
              </button>
            )}
          </div>
          {/* NO ONE FIGHTS ALONE slogan */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <RibbonIcon />
            <span className="text-yellow-300 font-semibold tracking-widest text-sm uppercase">No One Fights Alone</span>
            <RibbonIcon />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-14">

        {/* What is this */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-blue-100">What is this tool?</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            The <strong className="text-gray-800">Ewing's Sarcoma AI Support Assistant</strong> is a free resource built in
            partnership with the <strong className="text-gray-800">XIT Foundation</strong> to help patients, parents, and
            caregivers navigate one of the most complex and difficult diagnoses in pediatric oncology.
          </p>
          <p className="text-gray-600 leading-relaxed">
            This tool uses AI to answer your questions about Ewing's sarcoma — drawing on up-to-date knowledge of
            chemotherapy regimens, clinical trials, surgical options, radiation therapy, relapse management, survivorship,
            and more. When you fill out a patient profile, the AI tailors every response to your specific situation.
          </p>
        </section>

        {/* How it works */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-100">How it works</h2>
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
              className="mt-8 w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors shadow"
            >
              Create your free account →
            </button>
          )}
        </section>

        {/* What you can ask */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-100">What you can ask</h2>
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

        {/* Partnership with XIT */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-blue-100">Built in partnership with XIT Foundation</h2>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
            <p className="text-gray-700 leading-relaxed mb-4">
              The <strong className="text-gray-800">XIT Foundation</strong> is a nonprofit organization with one goal:
              to fund the pursuit of a <em>cure</em> for Ewing's sarcoma — not just better management of the disease.
              XIT funds only work aimed at curing Ewing's, drawing on the frontier of genetic medicine, gene editing,
              and nucleic-acid therapies.
            </p>
            <p className="text-gray-700 leading-relaxed mb-5">
              This AI tool was developed as part of XIT's commitment to supporting patients and families throughout the
              treatment journey — ensuring that access to knowledge is never a barrier for any family facing this diagnosis.
            </p>
            <a
              href="https://www.xit.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-blue-100">About this app</h2>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6">
            <p className="text-gray-700 leading-relaxed mb-4">
              This application was built by <strong className="text-gray-900">Dylan Rossi</strong>, an Ewing's sarcoma survivor.
              Dylan built the app at 16, two years after completing his last treatment. He worked with his family on the idea with
              a single goal: to help other families navigate their own fight with Ewing's sarcoma.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Dylan and his family have partnered with the <strong className="text-gray-900">XIT Foundation</strong> to spread the
              word about the app across the Ewing's community and gather feedback on how it can be improved — because every family
              deserves access to the best possible information.
            </p>
          </div>
        </section>

        {/* Disclaimer */}
        <div className="border-t border-gray-100 pt-8 text-center">
          <p className="text-sm text-gray-400 leading-relaxed max-w-xl mx-auto">
            <strong className="text-gray-500">Important:</strong> This AI assistant is for educational purposes only.
            Nothing here constitutes medical advice. Always make treatment decisions in close partnership with your
            medical oncology team.
          </p>
          <p className="text-xs text-gray-300 mt-3">
            Ewing's Sarcoma AI Support · In partnership with{' '}
            <a href="https://www.xit.org" target="_blank" rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-600">XIT Foundation</a> · © 2026
          </p>
        </div>
      </div>
    </div>
  );
}

