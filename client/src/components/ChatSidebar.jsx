import React, { useState } from 'react';

export default function ChatSidebar({
  chats, currentChatId, profile, user, view,
  onNewChat, onSelectChat, onDeleteChat, onRenameChat, onOpenProfile, onLogout, onSetView,
}) {
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal]   = useState('');

  function startRename(chat, e) {
    e.stopPropagation();
    setRenamingId(chat.id);
    setRenameVal(chat.name);
  }

  function commitRename(id) {
    if (renameVal.trim()) onRenameChat(id, renameVal.trim());
    setRenamingId(null);
  }

  const profileName = profile?.patientName || 'Patient Profile';
  const filledCount = profile
    ? Object.values(profile).filter(v => v !== '' && v !== null && v !== undefined && (!Array.isArray(v) || v.length > 0)).length
    : 0;

  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-full flex-shrink-0">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold leading-tight truncate">Ewing's Sarcoma</p>
            <p className="text-slate-400 text-xs leading-tight">AI Support Assistant</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="px-3 pt-3 pb-1 space-y-1">
        <button
          onClick={() => onSetView('home')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            view === 'home' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          XIT Home
        </button>
      </div>

      {/* New chat */}
      <div className="px-3 pt-1 pb-1">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-2 py-1 scrollbar-thin">
        {chats.length === 0 ? (
          <p className="text-slate-500 text-xs text-center py-6 px-3 leading-relaxed">
            No chats yet.<br />Click "New Chat" to start.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {chats.map(chat => (
              <li key={chat.id}>
                <div
                  onClick={() => onSelectChat(chat.id)}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    currentChatId === chat.id
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>

                  {renamingId === chat.id ? (
                    <input
                      autoFocus
                      value={renameVal}
                      onChange={e => setRenameVal(e.target.value)}
                      onBlur={() => commitRename(chat.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitRename(chat.id);
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      onClick={e => e.stopPropagation()}
                      className="flex-1 bg-slate-600 text-white text-sm rounded px-1 py-0.5 outline-none min-w-0"
                    />
                  ) : (
                    <span className="flex-1 text-sm truncate">{chat.name}</span>
                  )}

                  {/* Action buttons — visible on hover */}
                  <div
                    className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={e => startRename(chat, e)}
                      title="Rename"
                      className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onDeleteChat(chat.id); }}
                      title="Delete"
                      className="p-1 rounded text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Profile + logout */}
      <div className="px-3 py-3 border-t border-slate-700/60 space-y-1">
        <button
          onClick={onOpenProfile}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-medium truncate leading-tight">{profileName}</p>
            <p className="text-xs text-slate-500 leading-tight">
              {filledCount > 0 ? `${filledCount} field${filledCount !== 1 ? 's' : ''} saved` : 'Click to edit profile'}
            </p>
          </div>
          <svg className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors text-xs"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="truncate">{user?.email || 'Sign out'}</span>
        </button>
      </div>
    </aside>
  );
}
