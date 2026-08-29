import React, { useState, useEffect } from 'react';

export default function ChatSidebar({
  chats, currentChatId, profile, user, view, sidebarOpen,
  onNewChat, onSelectChat, onDeleteChat, onRenameChat, onOpenProfile, onOpenMedicalProfile, onLogout, onSetView, onCloseSidebar,
}) {
  const [renamingId, setRenamingId]   = useState(null);
  const [renameVal, setRenameVal]     = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Clear stale confirm state whenever the sidebar is closed
  useEffect(() => { if (!sidebarOpen) setConfirmLogout(false); }, [sidebarOpen]);

  function startRename(chat, e) {
    e.stopPropagation();
    setRenamingId(chat.id);
    setRenameVal(chat.name);
  }

  function commitRename(id) {
    if (renameVal.trim()) onRenameChat(id, renameVal.trim());
    setRenamingId(null);
  }

  const displayName = profile?._settings?.displayName?.trim();
  const profileName = displayName || profile?.patientName || 'My Profile';
  // Count only non-private (non-underscore) profile fields for the subtitle
  const filledCount = profile
    ? Object.entries(profile).filter(([k, v]) => !k.startsWith('_') && v !== '' && v !== null && v !== undefined && (!Array.isArray(v) || v.length > 0)).length
    : 0;

  function getInitials(name, email) {
    const src = name?.trim() || email || '';
    const words = src.split(/\s+/);
    return words.length > 1
      ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
      : src.slice(0, 2).toUpperCase();
  }

  return (
    <aside className={`w-64 bg-brand-teal-dark flex flex-col h-full flex-shrink-0 fixed inset-y-0 left-0 z-50 md:relative md:z-auto transition-transform duration-300 ease-in-out md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Brand */}
      <div className="px-4 py-3 border-b border-white/10 relative">
        <div className="flex items-center gap-2">
          <img src="/images/wordmark-wide.png" alt="Bell Guide" className="h-7 w-auto brightness-0 invert opacity-90" />
        </div>
        <button
          onClick={onCloseSidebar}
          className="md:hidden absolute top-3 right-3 text-[#94c9e0] hover:text-white p-1.5 rounded-lg transition-colors"
          aria-label="Close menu"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <div className="px-3 pt-3 pb-1 space-y-1">
        <button
          onClick={() => onSetView('home')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            view === 'home' ? 'bg-brand-teal-mid text-white' : 'text-[#94c9e0] hover:bg-brand-teal-mid/60 hover:text-white'
          }`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Home
        </button>
        <button
          onClick={() => { onSetView('files'); onCloseSidebar(); }}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            view === 'files' ? 'bg-brand-teal-mid text-white' : 'text-[#94c9e0] hover:bg-brand-teal-mid/60 hover:text-white'
          }`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
          My Files
        </button>
      </div>

      {/* New chat */}
      <div className="px-3 pt-1 pb-1">
        <button
          data-tutorial="new-chat"
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-1.5 py-2 bg-brand-teal hover:bg-brand-teal-hover text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-2 py-1 scrollbar-thin-light">
        {chats.length === 0 ? (
          <p className="text-[#6aabca] text-xs text-center py-6 px-3 leading-relaxed">
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
                      ? 'bg-brand-teal-mid text-white'
                      : 'text-[#bde3f0] hover:bg-brand-teal-mid/60 hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 text-[#4a8aaa] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                      className="flex-1 bg-brand-teal-mid text-white text-sm rounded px-1 py-0.5 outline-none min-w-0"
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
                      className="p-1 rounded text-[#94c9e0] hover:text-white transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onDeleteChat(chat.id); }}
                      title="Delete"
                      className="p-1 rounded text-[#94c9e0] hover:text-red-300 transition-colors"
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

      {/* Bottom buttons */}
      <div className="px-3 py-3 border-t border-white/10 space-y-1">

        {/* Medical Profile — standalone entry point */}
        <button
          data-tutorial="medical-profile-btn"
          onClick={onOpenMedicalProfile}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-teal-mid/60 text-[#bde3f0] hover:text-white transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-brand-teal-mid flex items-center justify-center flex-shrink-0 group-hover:bg-brand-teal transition-colors">
            <svg className="w-4 h-4 text-[#94c9e0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-medium truncate leading-tight">Medical Profile</p>
            <p className="text-xs text-[#6aabca] leading-tight">
              {filledCount > 0 ? `${filledCount} field${filledCount !== 1 ? 's' : ''} filled` : 'Not set up yet'}
            </p>
          </div>
          <svg className="w-3.5 h-3.5 text-[#4a8aaa] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Settings button */}
        <button
          data-tutorial="profile-btn"
          onClick={onOpenProfile}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-teal-mid/60 text-[#bde3f0] hover:text-white transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-brand-teal-mid flex items-center justify-center flex-shrink-0 group-hover:bg-brand-teal transition-colors flex-shrink-0">
            <span className="text-white text-xs font-semibold select-none">
              {getInitials(displayName, user?.email)}
            </span>
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-medium truncate leading-tight">{profileName}</p>
            <p className="text-xs text-[#6aabca] leading-tight">Personalization &amp; account</p>
          </div>
          <svg className="w-3.5 h-3.5 text-[#4a8aaa] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {confirmLogout ? (
          <div className="px-3 py-2 rounded-lg bg-brand-teal-mid border border-white/10">
            <p className="text-xs text-[#bde3f0] mb-2">Sign out of your account?</p>
            <div className="flex gap-2">
              <button
                onClick={onLogout}
                className="flex-1 text-xs py-1 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                Sign out
              </button>
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 text-xs py-1 text-[#94c9e0] hover:text-white border border-white/20 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmLogout(true)}
            title="Sign out"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#4a8aaa] hover:text-red-300 hover:bg-brand-teal-mid/60 transition-colors text-xs"
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="truncate">{user?.email || 'Sign out'}</span>
            {user?.isTest && (
              <span className="ml-auto flex-shrink-0 text-[10px] font-bold tracking-wide bg-amber-500 text-white rounded px-1.5 py-0.5">
                TEST
              </span>
            )}
          </button>
        )}
        {/* Brand medallion at the very bottom of the sidebar */}
        <div className="pt-2 flex justify-center">
          <img
            src="/images/boy-bell-circle.png"
            alt=""
            className="w-20 h-20 rounded-full object-cover opacity-70"
          />
        </div>
      </div>
    </aside>
  );
}
