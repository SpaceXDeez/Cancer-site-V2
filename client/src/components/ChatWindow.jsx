import React, { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble.jsx';

const STARTER_PROMPTS = [
  { label: 'Side effects of VDC/IE',        text: 'What are the side effects of VDC/IE chemotherapy (vincristine, doxorubicin, cyclophosphamide, ifosfamide, etoposide) and how are they managed?' },
  { label: 'Available clinical trials',      text: 'What clinical trials are currently recruiting for Ewing\'s sarcoma? Are there any I should know about given my patient\'s profile?' },
  { label: 'Relapsed Ewing\'s options',      text: 'What are the treatment options for relapsed or refractory Ewing\'s sarcoma?' },
  { label: 'Questions for my oncologist',    text: 'What are the most important questions I should ask my oncologist at our next appointment?' },
  { label: 'Understanding scan results',     text: 'Can you help me understand what terms like PET scan, MRI, "no evidence of disease," and "partial response" mean in the context of Ewing\'s sarcoma?' },
  { label: 'Late effects of treatment',      text: 'What are the potential long-term and late effects of Ewing\'s sarcoma treatment on a child\'s development and health?' },
];

const INTRO_CONTENT = `Hello! I'm an AI-based support assistant dedicated to helping patients and families battling **Ewing's sarcoma**.

I can help you with:
- **Treatment options** — VDC/IE chemotherapy, surgery, radiation, stem cell transplant, and emerging therapies
- **Understanding your diagnosis** — tumor pathology, staging, EWSR1 fusions, imaging results explained
- **Side effects** — managing side effects from chemo drugs (vincristine, doxorubicin, ifosfamide, etoposide, etc.)
- **Clinical trials** — identifying studies your patient may be eligible for, with NCT numbers when possible
- **Prognosis** — understanding what factors affect outcomes and what the data shows
- **Questions for your doctor** — preparing for appointments and second opinions
- **Survivorship & late effects** — life after treatment, long-term monitoring, fertility preservation

If you've filled out the patient profile (click the profile button in the sidebar), I'll use that information to give you more tailored answers.

**Important:** All of my responses are AI-generated and for educational purposes only. Please make all treatment decisions in close collaboration with your medical oncology team.

How can I help you today?`;

export default function ChatWindow({ chat, profile, authFetch, onRenameChat }) {
  const [messages, setMessages] = useState(null);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const bottomRef               = useRef(null);
  const textareaRef             = useRef(null);

  useEffect(() => {
    authFetch(`/api/chats/${chat.id}/messages`)
      .then(r => r.json())
      .then(data => setMessages(data.messages || []))
      .catch(() => setMessages([]));
  }, [chat.id]);

  const isNew = messages !== null && messages.length === 0;
  const displayMessages = isNew
    ? [{ id: 'intro', role: 'assistant', content: INTRO_CONTENT, created_at: new Date().toISOString() }]
    : (messages || []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages.length, loading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [input]);

  async function send(text) {
    const trimmed = text.trim();
    if (!trimmed || loading || messages === null) return;

    const optimistic = { id: `tmp-${Date.now()}`, role: 'user', content: trimmed, created_at: new Date().toISOString() };
    setMessages(prev => [...(prev || []), optimistic]);
    setInput('');
    setError(null);
    setLoading(true);

    if ((messages || []).length === 0 && chat.name === 'New Chat') {
      onRenameChat(trimmed.length > 45 ? trimmed.slice(0, 45) + '…' : trimmed);
    }

    try {
      const res = await authFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ chatId: chat.id, content: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error (${res.status})`);
      }
      const data = await res.json();
      setMessages(prev => [...(prev || []), {
        id: `ai-${Date.now()}`, role: 'assistant', content: data.content, created_at: new Date().toISOString(),
      }]);
    } catch (err) {
      setError(err.message);
      setMessages(prev => (prev || []).filter(m => m.id !== optimistic.id));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  function handleExport() {
    const lines = (messages || []).map(m =>
      `[${m.role === 'user' ? 'You' : 'AI'}] ${new Date(m.created_at).toLocaleString()}\n${m.content}`
    );
    const text = `Chat: ${chat.name}\nExported: ${new Date().toLocaleString()}\n\n${lines.join('\n\n---\n\n')}`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    a.download = `${chat.name.replace(/[^a-z0-9]/gi, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Build profile summary for header chip
  const profileChips = [];
  if (profile?.patientName) profileChips.push(profile.patientName);
  if (profile?.treatmentPhase) {
    const short = profile.treatmentPhase.split('(')[0].split('—')[0].trim().replace(/\s*\(.*/, '');
    profileChips.push(short);
  } else if (profile?.currentStatus) {
    profileChips.push(profile.currentStatus.split('(')[0].split('—')[0].trim());
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between pr-5 pl-14 md:pl-5 py-3 border-b border-gray-200 flex-shrink-0 gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-900 text-sm truncate">{chat.name}</h2>
          <p className="text-xs text-gray-400">
            {messages === null ? 'Loading…' : `${messages.length} message${messages.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Profile context chip */}
          {profileChips.length > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {profileChips.join(' · ')}
            </span>
          )}

          {/* Export button */}
          {(messages || []).length > 0 && (
            <button
              onClick={handleExport}
              title="Export chat as .txt"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Export</span>
            </button>
          )}

          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="hidden sm:inline">AI-generated · </span>Not medical advice
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages === null ? (
          <div className="flex justify-center pt-12">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {displayMessages.map(msg => <MessageBubble key={msg.id} message={msg} />)}

            {/* Starter prompts — shown only in a brand-new empty chat */}
            {isNew && !loading && (
              <div className="max-w-3xl">
                <p className="text-xs text-gray-400 mb-2 ml-11">Suggested questions to get started:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-11">
                  {STARTER_PROMPTS.map(p => (
                    <button
                      key={p.label}
                      onClick={() => send(p.text)}
                      className="text-left px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 text-xs text-gray-600 hover:text-blue-700 transition-colors leading-snug"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {loading && (
          <div className="flex items-start gap-3">
            <AiAvatar />
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                {[0, 150, 300].map(d => (
                  <span key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm max-w-lg text-center">
              <span className="font-medium">Error: </span>{error}
              <button onClick={() => setError(null)} className="ml-3 text-red-500 hover:text-red-700 underline text-xs">
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-200 px-4 pb-4 pt-3 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 bg-gray-50 border border-gray-300 rounded-2xl px-4 py-2.5 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-300 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || messages === null}
              placeholder="Ask about treatments, side effects, clinical trials, or anything about Ewing's sarcoma…"
              rows={1}
              className="flex-1 bg-transparent outline-none resize-none text-sm text-gray-800 placeholder-gray-400 leading-relaxed"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading || messages === null}
              className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-blue-700 transition-colors self-end mb-0.5"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-1.5">
            Enter to send · Shift+Enter for new line · All responses are AI-generated
          </p>
        </div>
      </div>
    </div>
  );
}

export function AiAvatar() {
  return (
    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    </div>
  );
}

