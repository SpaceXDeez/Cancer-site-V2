import React, { useState, useRef, useEffect } from 'react';
import MessageBubble, { AiAvatar } from './MessageBubble.jsx';

const STARTER_PROMPTS = [
  { label: 'Side effects of VDC/IE',        text: 'What are the side effects of VDC/IE chemotherapy (vincristine, doxorubicin, cyclophosphamide, ifosfamide, etoposide) and how are they managed?' },
  { label: 'Available clinical trials',      text: 'What clinical trials are currently recruiting for Ewing\'s sarcoma? Are there any I should know about given my patient\'s profile?' },
  { label: 'Relapsed Ewing\'s options',      text: 'What are the treatment options for relapsed or refractory Ewing\'s sarcoma?' },
  { label: 'Questions for my oncologist',    text: 'What are the most important questions I should ask my oncologist at our next appointment?' },
  { label: 'Understanding scan results',     text: 'Can you help me understand what terms like PET scan, MRI, "no evidence of disease," and "partial response" mean in the context of Ewing\'s sarcoma?' },
  { label: 'Late effects of treatment',      text: 'What are the potential long-term and late effects of Ewing\'s sarcoma treatment on a child\'s development and health?' },
];

export default function ChatWindow({ chat, profile, authFetch, onRenameChat, onUpdateProfile }) {
  const [messages, setMessages] = useState(null);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [attachment, setAttachment]         = useState(null);
  const [uploading, setUploading]           = useState(false);
  const [uploadError, setUploadError]       = useState(null);
  const [profileSuggestion, setProfileSuggestion] = useState(null); // { description } — auto-saved
  const bottomRef            = useRef(null);
  const aiResponseRef        = useRef(null);
  const prevLoadingRef       = useRef(false);
  const textareaRef          = useRef(null);
  const fileInputRef         = useRef(null);
  const profileToastTimer    = useRef(null);

  useEffect(() => {
    authFetch(`/api/chats/${chat.id}/messages`)
      .then(r => r.json())
      .then(data => setMessages(data.messages || []))
      .catch(() => setMessages([]));
  }, [chat.id]);

  const isNew = messages !== null && messages.length === 0;
  // Empty array — new-chat uses a hero layout, not a fake message bubble
  const displayMessages = isNew ? [] : (messages || []);

  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    prevLoadingRef.current = loading;
    if (wasLoading && !loading) {
      // AI response just arrived — scroll to its top so user reads from the beginning
      aiResponseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayMessages.length, loading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [input]);

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res  = await authFetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');
      setAttachment({ name: file.name, text: data.text });
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function send(text) {
    const trimmed = text.trim();
    if ((!trimmed && !attachment) || loading || messages === null) return;

    const content = attachment
      ? `[Attached: ${attachment.name}]${trimmed ? `\n\n${trimmed}` : ''}`
      : trimmed;
    const optimistic = { id: `tmp-${Date.now()}`, role: 'user', content, created_at: new Date().toISOString() };
    setMessages(prev => [...(prev || []), optimistic]);
    setInput('');
    setAttachment(null);
    setError(null);
    setLoading(true);

    if ((messages || []).length === 0 && chat.name === 'New Chat') {
      const label = trimmed || attachment?.name || 'Uploaded document';
      onRenameChat(label.length > 45 ? label.slice(0, 45) + '…' : label);
    }

    try {
      const res = await authFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ chatId: chat.id, content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error (${res.status})`);
      }
      const data = await res.json();
      setMessages(prev => [...(prev || []), {
        id: `ai-${Date.now()}`, role: 'assistant', content: data.content, created_at: new Date().toISOString(),
      }]);
      if (data.contextSuggestion) {
        onUpdateProfile(data.contextSuggestion.fields); // auto-save without asking
        setProfileSuggestion({ description: data.contextSuggestion.description });
        clearTimeout(profileToastTimer.current);
        profileToastTimer.current = setTimeout(() => setProfileSuggestion(null), 6000);
      }
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
              title="Download chat as .txt"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Download</span>
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

      {/* Below-header content: centered cluster for new chat, normal scroll for existing */}
      <div className={isNew ? 'flex-1 flex flex-col justify-center overflow-y-auto' : 'flex-1 flex flex-col overflow-hidden'}>
      {/* Messages / new-chat hero */}
      <div className={isNew ? 'px-4 pt-6 pb-4' : 'flex-1 overflow-y-auto px-4 py-5'}>
        {messages === null ? (
          <div className="flex justify-center pt-12">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isNew ? (
          /* Centered hero — shown before any message is sent */
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p className="text-xl font-bold text-gray-900 max-w-sm leading-snug">
              AI support assistant for Ewing&apos;s sarcoma patients and families
            </p>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              Ask about treatments, side effects, clinical trials, survivorship, and more.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayMessages.map((msg, i) => {
              const isLastAi = msg.role === 'assistant' && i === displayMessages.length - 1;
              return (
                <React.Fragment key={msg.id}>
                  {isLastAi && <div ref={aiResponseRef} />}
                  <MessageBubble message={msg} />
                </React.Fragment>
              );
            })}

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
        )}
      </div>

{/* Profile auto-saved toast */}
      {profileSuggestion && (
        <div className="flex-shrink-0 bg-emerald-50 border-t border-emerald-200 px-4 py-2">
          <div className="max-w-3xl mx-auto flex items-center gap-2.5">
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-xs text-emerald-800 flex-1">
              <strong>Profile updated:</strong> {profileSuggestion.description}
            </p>
            <button onClick={() => setProfileSuggestion(null)} className="text-emerald-400 hover:text-emerald-700 text-xs">✕</button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className={`flex-shrink-0 px-4 pt-4 bg-white${isNew ? '' : ' border-t border-gray-100 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]'}`} style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
        <div className="max-w-3xl mx-auto">

          {/* Attachment chip */}
          {(attachment || uploading || uploadError) && (
            <div className="mb-2 flex items-center gap-2">
              {uploading && (
                <span className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                  <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  Processing file…
                </span>
              )}
              {attachment && !uploading && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 max-w-xs truncate">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="truncate">{attachment.name}</span>
                  <button onClick={() => setAttachment(null)} className="ml-1 flex-shrink-0 text-emerald-500 hover:text-emerald-800">✕</button>
                </span>
              )}
              {uploadError && (
                <span className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                  {uploadError}
                  <button onClick={() => setUploadError(null)} className="ml-1 text-red-400 hover:text-red-700">✕</button>
                </span>
              )}
            </div>
          )}

          <div data-tutorial="chat-input" className="flex items-end gap-2 bg-white border-2 border-gray-200 rounded-2xl px-4 py-3 shadow-md focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
            {/* Paperclip button */}
            <button
              data-tutorial="attach-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || uploading || messages === null}
              title="Attach a PDF or image"
              className="flex-shrink-0 text-blue-400 hover:text-blue-600 disabled:opacity-30 transition-colors self-end mb-0.5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || messages === null}
              placeholder="Ask about treatments, side effects, clinical trials, or anything about Ewing's sarcoma…"
              rows={1}
              className="flex-1 bg-transparent outline-none resize-none text-sm text-gray-900 placeholder-gray-500 leading-relaxed"
            />
            <button
              onClick={() => send(input)}
              disabled={(!input.trim() && !attachment) || loading || uploading || messages === null}
              className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-30 hover:bg-blue-700 transition-colors self-end"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            <span className="hidden sm:inline">Enter to send · Shift+Enter for new line · </span>
            <span className="sm:hidden">Tap the arrow to send · </span>
            All responses are AI-generated
          </p>
        </div>
      </div>

      {/* Suggested questions — shown below input only on new empty chats */}
      {isNew && !loading && (
        <div className="flex-shrink-0 px-4 pb-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs text-gray-400 mb-2 text-center">Suggested questions to get started</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {STARTER_PROMPTS.map(p => (
                <button
                  key={p.label}
                  onClick={() => send(p.text)}
                  className="text-left px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 text-xs text-gray-600 hover:text-blue-700 transition-colors leading-snug"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

