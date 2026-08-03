import React, { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble.jsx';

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

**Important:** All of my responses are AI-generated and for educational purposes only. Please make all treatment decisions in close collaboration with your medical oncology team. I'm here to help you understand, prepare, and ask better questions — not to replace your doctors.

How can I help you today?`;

const INTRO_MESSAGE = {
  id: 'intro',
  role: 'assistant',
  content: INTRO_CONTENT,
  timestamp: new Date().toISOString(),
};

export default function ChatWindow({ chat, profile, onUpdateMessages, onRenameChat }) {
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const bottomRef               = useRef(null);
  const textareaRef             = useRef(null);

  const displayMessages = chat.messages.length === 0 ? [INTRO_MESSAGE] : chat.messages;

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages.length, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [input]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...chat.messages, userMsg];
    onUpdateMessages(newMessages);
    setInput('');
    setError(null);
    setLoading(true);

    // Auto-name chat from first message
    if (chat.messages.length === 0 && chat.name === 'New Chat') {
      onRenameChat(text.length > 45 ? text.slice(0, 45) + '…' : text);
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          patientProfile: profile,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error (${res.status})`);
      }

      const data = await res.json();
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date().toISOString(),
      };
      onUpdateMessages([...newMessages, aiMsg]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0">
        <div>
          <h2 className="font-semibold text-gray-900 text-sm">{chat.name}</h2>
          <p className="text-xs text-gray-400">
            {chat.messages.length} message{chat.messages.length !== 1 ? 's' : ''}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          AI-generated · Not medical advice
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {displayMessages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-start gap-3">
            <AiAvatar />
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                {[0, 150, 300].map(delay => (
                  <span
                    key={delay}
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm max-w-lg text-center">
              <span className="font-medium">Error: </span>{error}
              <button
                onClick={() => setError(null)}
                className="ml-3 text-red-500 hover:text-red-700 underline text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-gray-200 px-4 pb-4 pt-3 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 bg-gray-50 border border-gray-300 rounded-2xl px-4 py-2.5 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-300 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Ask about treatments, side effects, clinical trials, or anything about Ewing's sarcoma…"
              rows={1}
              className="flex-1 bg-transparent outline-none resize-none text-sm text-gray-800 placeholder-gray-400 leading-relaxed"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-blue-700 transition-colors self-end mb-0.5"
              title="Send (Enter)"
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

function AiAvatar() {
  return (
    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    </div>
  );
}

export { AiAvatar };
