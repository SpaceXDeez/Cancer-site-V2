import React, { useState, useEffect, useLayoutEffect } from 'react';

const STEPS = [
  {
    target: null,
    title: 'Welcome to your AI support tool 👋',
    body: "Let's take a quick tour so you know how to get the most out of this.",
  },
  {
    target: 'new-chat',    requiresSidebar: true,    title: 'Organize with multiple chats',
    body: 'Create a separate chat for each topic — side effects, clinical trials, appointment prep. Each one remembers its own conversation.',
    position: 'right',
  },
  {
    target: 'settings-tab-profile',
    settingsTab: 'profile',
    title: 'Profile — your medical background',
    body: 'The AI reads this on every message. Fill it in so responses are specific to the patient\'s diagnosis, treatment, and symptoms.',
    position: 'right',
  },
  {
    target: 'settings-tab-personalization',
    settingsTab: 'personalization',
    title: 'Personalization — set the tone',
    body: 'Choose Supportive & Simple, Balanced, or Clinical & Detailed. Add custom instructions the AI always follows.',
    position: 'right',
  },
  {
    target: 'settings-tab-account',
    settingsTab: 'account',
    title: 'Account',
    body: 'View your email address and change your password any time.',
    position: 'right',
  },
  {
    target: 'settings-tab-data',
    settingsTab: 'data',
    title: 'Data controls',
    body: 'Download everything as JSON, wipe all chat history, or permanently delete your account.',
    position: 'right',
  },
  {
    target: 'attach-btn',
    title: 'Attach lab results & scan reports',
    body: 'Upload PDFs or photos of blood work, imaging summaries, or pathology results. The AI will read and reference them.',
    position: 'top',
  },
  {
    target: 'chat-input',
    title: 'Ask anything here',
    body: "Type your question and press Enter. Be specific — the AI knows the patient's full profile.",
    position: 'top',
  },
];

const PAD = 12;
const CALLOUT_W = 288;

export default function TutorialOverlay({ onDone, onSettingsNav, onOpenSidebar }) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [win, setWin] = useState({
    w: window.innerWidth,
    h: window.visualViewport?.height ?? window.innerHeight,
  });

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function measureTarget() {
    if (!current.target) { setTargetRect(null); return; }
    const el = document.querySelector(`[data-tutorial="${current.target}"]`);
    if (!el) { setTargetRect(null); return; }
    const r = el.getBoundingClientRect();
    // Treat as missing if entirely outside the visible viewport (e.g. hidden sidebar on mobile)
    if (r.right < 0 || r.bottom < 0 || r.left > win.w || r.top > win.h) {
      setTargetRect(null);
      return;
    }
    setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }

  useLayoutEffect(measureTarget, [step, current.target]);

  // Close any open settings on mount; clean up on unmount
  useEffect(() => {
    onSettingsNav(null);
    return () => onSettingsNav(null);
  }, []);

  // Delayed re-measure — longer delay for steps that need a sidebar/modal to animate in
  useEffect(() => {
    if (!current.target) return;
    const delay = current.requiresSidebar ? 400 : 120;
    const t = setTimeout(measureTarget, delay);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    const handler = () => {
      setWin({
        w: window.innerWidth,
        h: window.visualViewport?.height ?? window.innerHeight,
      });
      measureTarget();
    };
    window.addEventListener('resize', handler);
    window.visualViewport?.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('resize', handler);
      window.visualViewport?.removeEventListener('resize', handler);
    };
  }, [step]);

  // Compute callout card position
  let callout = {};
  if (!targetRect) {
    callout = { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
  } else {
    const { top, left, width, height } = targetRect;
    const pos = current.position || 'bottom';
    const ARROW_GAP = 14;
    if (pos === 'right') {
      const idealTop = top + height / 2 - 110;
      const idealLeft = left + width + PAD + ARROW_GAP;
      callout = {
        top: Math.max(12, Math.min(win.h - 240, idealTop)),
        left: Math.min(win.w - CALLOUT_W - 12, idealLeft), // clamp so card doesn't bleed off right edge
      };
    } else if (pos === 'top') {
      const cardLeft = Math.max(12, Math.min(win.w - CALLOUT_W - 12, left + width / 2 - CALLOUT_W / 2));
      callout = { bottom: win.h - top + PAD + ARROW_GAP, left: cardLeft };
    } else {
      const cardLeft = Math.max(12, Math.min(win.w - CALLOUT_W - 12, left + width / 2 - CALLOUT_W / 2));
      callout = { top: top + height + PAD + ARROW_GAP, left: cardLeft };
    }
  }

  function advance() {
    const nextIndex = isLast ? null : step + 1;
    if (nextIndex !== null) {
      const next = STEPS[nextIndex];
      if (next.requiresSidebar) onOpenSidebar?.();
      if (next.settingsTab) {
        onSettingsNav(next.settingsTab);
      } else if (current.settingsTab) {
        onSettingsNav(null);
      }
      setStep(nextIndex);
    } else {
      if (current.settingsTab) onSettingsNav(null);
      localStorage.setItem('tutorialDone', '1');
      onDone();
    }
  }

  function skip() {
    if (current.settingsTab) onSettingsNav(null);
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

      {/* Callout card — flex-col so footer always stays visible */}
      <div
        className="absolute bg-white rounded-2xl shadow-2xl pointer-events-auto flex flex-col"
        style={{ width: CALLOUT_W, maxHeight: 'calc(100vh - 24px)', ...callout }}
      >
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
              {step === 0 ? 'Quick Tour' : `Step ${step} of ${STEPS.length - 1}`}
            </span>
            <button onClick={skip} className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
              Skip tour
            </button>
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-2 leading-snug">{current.title}</h3>
          <p className="text-xs text-gray-600 leading-relaxed">{current.body}</p>
        </div>

        {/* Pinned footer */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 pb-4 pt-2">
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
