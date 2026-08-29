import React, { useEffect, useState } from 'react';

export default function SharedMessageView({ token }) {
  const [content, setContent] = useState(null);
  const [error, setError]     = useState(null);

  useEffect(() => {
    fetch(`/api/shared/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setContent(data.content))
      .catch(() => setError('This link is invalid or has expired.'));
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header — safe-area-inset-top for notched phones */}
      <div className="bg-white border-b border-gray-200 px-4 pb-3 flex items-center gap-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <div className="w-8 h-8 rounded-full bg-brand-teal flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.346A3.67 3.67 0 0116 16.5H8.68a3.67 3.67 0 01-2.596-1.066l-.347-.347z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Ewing Support AI</p>
          <p className="text-xs text-gray-500">Shared response</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {error ? (
            <div className="bg-white rounded-2xl border border-gray-200 px-6 py-8 text-center">
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
          ) : content === null ? (
            <div className="bg-white rounded-2xl border border-gray-200 px-6 py-8 flex justify-center">
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map(d => (
                  <span key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 px-6 py-5">
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed break-words">{content}</p>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-4">
            This is an AI-generated response. Always consult a medical professional for personal medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}
