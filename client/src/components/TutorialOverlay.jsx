import React, { useState, useEffect, useLayoutEffect } from 'react';

const SETTINGS_TABS = [
  { icon: '👤', tab: 'Profile',         desc: 'Set your display name and edit the full medical profile the AI reads on every message.' },
  { icon: '✨', tab: 'Personalization', desc: "Pick the AI's tone (supportive / balanced / clinical) and add custom instructions it always follows." },
  { icon: '🔒', tab: 'Account',         desc: 'View your email and change your password.' },
  { icon: '📁', tab: 'Data controls',   desc: 'Download everything as JSON, delete all chats, or permanently delete your account.' },
];

const STEPS = [
  {
    target: null,
    title: 'Welcome to your AI support tool 👋',
    body: "Quick 5-step tour so you know how to get the most out of this. Takes about 30 seconds.",
  },
  {
    target: 'new-chat',
    title: 'Organize with multiple chats',
    body: 'Create a separate chat for each topic — side effects, clinical trials, appointment prep. Each one remembers its own full conversation.',
    position: 'right',
  },
  {
    target: 'profile-btn',
    title: "The Settings panel — click here any time",
    body: "This opens your settings. Here's what's inside:",
    extra: SETTINGS_TABS,
    position: 'right',
    wide: true,
  },
  {
    target: 'attach-btn',
    title: 'Attach lab results & scan reports',
    body: 'Upload PDFs or photos of blood work, imaging summaries, or pathology results. The AI will read and reference them when you ask questions.',
    position: 'top',
  },
  {
    target: 'chat-input',
    title: 'Ask anything here',
    body: "Type your question and press Enter. Be specific — \"what do my neutrophil counts mean?\" or \"are there trials for relapsed Ewing's?\" The AI knows your patient's profile.",
    position: 'top',
  },
];

const PAD = 12;
const CALLOUT_W = 288;
const CALLOUT_W_WIDE = 340;

export default function TutorialOverlay({ onDone }) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [win, setWin] = useState({ w: window.innerWidth, h: window.innerHeight });

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function measureTarget() {
    if (!current.target) { setTargetRect(null); return; }
    const el = document.querySelector(`[data-tutorial="${current.target}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    } else {
      setTargetRect(null);
    }
  }

  useLayoutEffect(measureTarget, [step, current.target]);

  useEffect(() => {
    const handler = () => {
      setWin({ w: window.innerWidth, h: window.innerHeight });
      measureTarget();
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [step]);

  // Compute callout card position
  const cardW = current.wide ? CALLOUT_W_WIDE : CALLOUT_W;
  let callout = {};
  if (!targetRect) {
    callout = { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
  } else {
    const { top, left, width, height } = targetRect;
    const pos = current.position || 'bottom';
    const ARROW_GAP = 14;
    if (pos === 'right') {
      callout = {
        top: Math.max(12, Math.min(win.h - 260, top + height / 2 - 90)),
        left: left + width + PAD + ARROW_GAP,
      };
    } else if (pos === 'top') {
      const cardLeft = Math.max(12, Math.min(win.w - cardW - 12, left + width / 2 - cardW / 2));
      callout = { bottom: win.h - top + PAD + ARROW_GAP, left: cardLeft };
    } else {
      const cardLeft = Math.max(12, Math.min(win.w - cardW - 12, left + width / 2 - cardW / 2));
      callout = { top: top + height + PAD + ARROW_GAP, left: cardLeft };
    }
  }

  function advance() {
    if (isLast) {
      localStorage.setItem('tutorialDone', '1');
      onDone();
    } else {
      setStep(s => s + 1);
    }
  }

  function skip() {
    localStorage.setItem('tutorialDone', '1');
    onDone();
  }

  return (
    <div className="fixed inset-0 z-[200]">
      {/* SVG backdrop with spotlight hole */}
      <svg
        className="absolute inset-0"
        width={win.w}
        height={win.h}
        style={{ display: 'block' }}
      >
        <defs>
          <mask id="t-mask">
            <rect x="0" y="0" width={win.w} height={win.h} fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - PAD}
                y={targetRect.top - PAD}
                width={targetRect.width + PAD * 2}
                height={targetRect.height + PAD * 2}
                rx="10"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect x="0" y="0" width={win.w} height={win.h} fill="rgba(0,0,0,0.78)" mask="url(#t-mask)" />
      </svg>

      {/* Glow ring around spotlight */}
      {targetRect && (
        <div
          className="absolute rounded-xl border-2 border-blue-400 pointer-events-none"
          style={{
            top: targetRect.top - PAD,
            left: targetRect.left - PAD,
            width: targetRect.width + PAD * 2,
            height: targetRect.height + PAD * 2,
            boxShadow: '0 0 0 4px rgba(96,165,250,0.25)',
          }}
        />
      )}

      {/* Callout card */}
      <div
        className="absolute bg-white rounded-2xl shadow-2xl p-5 pointer-events-auto"
        style={{ width: cardW, ...callout }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
            {step === 0 ? 'Quick Tour' : `Step ${step} of ${STEPS.length - 1}`}
          </span>
          <button
            onClick={skip}
            className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            Skip tour
          </button>
        </div>

        <h3 className="text-sm font-bold text-gray-900 mb-2 leading-snug">{current.title}</h3>
        <p className="text-xs text-gray-600 leading-relaxed mb-3">{current.body}</p>

        {/* Settings-tab breakdown */}
        {current.extra && (
          <div className="mb-4 space-y-2.5 bg-gray-50 rounded-xl p-3 border border-gray-100">
            {current.extra.map(({ icon, tab, desc }) => (
              <div key={tab} className="flex gap-2.5 items-start">
                <span className="text-sm leading-none mt-0.5 flex-shrink-0">{icon}</span>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-gray-800">{tab}</span>
                  <span className="text-xs text-gray-500"> — {desc}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between">
          {/* Dot indicators */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`rounded-full transition-all ${
                  i === step ? 'w-4 h-1.5 bg-blue-500' : 'w-1.5 h-1.5 bg-gray-200'
                }`}
              />
            ))}
          </div>
          <button
            onClick={advance}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            {step === 0 ? "Let's go →" : isLast ? 'Got it ✓' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
