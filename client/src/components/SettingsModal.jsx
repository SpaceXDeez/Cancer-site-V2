import React, { useState } from 'react';

function getInitials(name, email) {
  const src = name?.trim() || email || '';
  const words = src.split(/\s+/);
  return words.length > 1
    ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
    : src.slice(0, 2).toUpperCase();
}

const TABS = [
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 'personalization',
    label: 'Personalization',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
  },
  {
    id: 'account',
    label: 'Account',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 'data',
    label: 'Data controls',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
  },
];

const AI_STYLES = [
  {
    id: 'supportive',
    label: 'Supportive & Simple',
    description: 'Warm, accessible language. Prioritises emotional support alongside information.',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Mix of clinical detail and plain language. Good for most users.',
  },
  {
    id: 'clinical',
    label: 'Clinical & Detailed',
    description: 'Precise medical terminology and comprehensive detail for medically literate users.',
  },
];

export default function SettingsModal({ user, profile, authFetch, onSave, onDeleteAllChats, onDeleteAccount, onOpenQuestionnaire, onClose, initialTab = 'profile' }) {
  const settings = profile?._settings || {};

  const [tab, setTab]                   = useState(initialTab);
  const [displayName, setDisplayName]   = useState(settings.displayName || '');
  const [aiStyle, setAiStyle]           = useState(settings.aiStyle || 'balanced');
  const [customInstructions, setCustom] = useState(settings.customInstructions || '');
  const [saving, setSaving]             = useState(false);
  const [savedMsg, setSavedMsg]         = useState('');

  // Change-password state
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [pwError, setPwError]       = useState('');
  const [pwSuccess, setPwSuccess]   = useState('');
  const [pwLoading, setPwLoading]   = useState(false);

  // Data-tab confirmation state
  const [confirmChats, setConfirmChats]     = useState(false);
  const [confirmAccount, setConfirmAccount] = useState(false);
  const [deletingChats, setDeletingChats]   = useState(false);

  async function savePersonalization() {
    setSaving(true);
    await onSave({ displayName, aiStyle, customInstructions });
    setSaving(false);
    setSavedMsg('Saved');
    setTimeout(() => setSavedMsg(''), 2500);
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    setPwLoading(true);
    try {
      const res  = await authFetch('/api/auth/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error || 'Failed to change password.'); return; }
      setPwSuccess('Password changed successfully.');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch { setPwError('Could not connect to server.'); }
    finally  { setPwLoading(false); }
  }

  async function exportData() {
    try {
      const res  = await authFetch('/api/export');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `ewings-support-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silently fail — user will notice nothing downloaded */ }
  }

  async function handleDeleteAllChats() {
    setDeletingChats(true);
    await onDeleteAllChats();
    setDeletingChats(false);
    setConfirmChats(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 sm:p-4">
      <div className="bg-white sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden rounded-t-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mobile: horizontal tab bar */}
        <div className="sm:hidden flex-shrink-0 border-b border-gray-100 overflow-x-auto">
          <div className="flex px-4 gap-1 py-1.5">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors flex-shrink-0 ${
                  tab === t.id
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Desktop: left nav */}
          <nav className="hidden sm:block w-44 flex-shrink-0 border-r border-gray-100 py-3 px-2 space-y-0.5">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                  tab === t.id
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>

          {/* Right content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* ── Profile ── */}
            {tab === 'profile' && (
              <>
                {/* Avatar */}
                <div className="flex flex-col items-center gap-3 pb-5 border-b border-gray-100">
                  <div className="w-20 h-20 rounded-full bg-slate-400 flex items-center justify-center">
                    <span className="text-white text-2xl font-semibold select-none">
                      {getInitials(displayName || settings.displayName, user?.email)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Display name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    maxLength={60}
                    placeholder="Your name"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">Shown in the sidebar. Not used medically.</p>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Medical profile</p>
                    <p className="text-xs text-gray-500 mt-0.5">Diagnosis, treatment, medications, and more.</p>
                  </div>
                  <button
                    onClick={() => { onSave({ displayName, aiStyle, customInstructions }); onOpenQuestionnaire(); }}
                    className="flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Edit
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={savePersonalization}
                    disabled={saving}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  {savedMsg && <span className="text-sm text-emerald-600">{savedMsg}</span>}
                </div>
              </>
            )}

            {/* ── Personalization ── */}
            {tab === 'personalization' && (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-0.5">AI communication style</h3>
                  <p className="text-xs text-gray-500 mb-3">Controls how the AI phrases its responses. Doesn't affect medical accuracy.</p>
                  <div className="space-y-2">
                    {AI_STYLES.map(s => (
                      <label
                        key={s.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          aiStyle === s.id
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="aiStyle"
                          value={s.id}
                          checked={aiStyle === s.id}
                          onChange={() => setAiStyle(s.id)}
                          className="mt-0.5 accent-blue-600"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 leading-tight">{s.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Custom instructions</h3>
                  <p className="text-xs text-gray-500 mb-2">Tell the AI anything extra about how you'd like it to respond — e.g. "Always mention whether something affects fertility."</p>
                  <textarea
                    value={customInstructions}
                    onChange={e => setCustom(e.target.value)}
                    maxLength={500}
                    rows={4}
                    placeholder="Additional preferences for how the AI responds…"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                  <p className="text-xs text-gray-400 text-right mt-0.5">{customInstructions.length}/500</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={savePersonalization}
                    disabled={saving}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  {savedMsg && <span className="text-sm text-emerald-600">{savedMsg}</span>}
                </div>
              </>
            )}

            {/* ── Account ── */}
            {tab === 'account' && (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Email address</h3>
                  <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {user?.email || '—'}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Change password</h3>
                  <form onSubmit={changePassword} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Current password</label>
                      <input
                        type="password"
                        value={currentPw}
                        onChange={e => setCurrentPw(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">New password</label>
                      <input
                        type="password"
                        value={newPw}
                        onChange={e => setNewPw(e.target.value)}
                        required
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Confirm new password</label>
                      <input
                        type="password"
                        value={confirmPw}
                        onChange={e => setConfirmPw(e.target.value)}
                        required
                        autoComplete="new-password"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    {pwError   && <p className="text-xs text-red-600">{pwError}</p>}
                    {pwSuccess && <p className="text-xs text-emerald-600">{pwSuccess}</p>}
                    <button
                      type="submit"
                      disabled={pwLoading}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {pwLoading ? 'Updating…' : 'Update password'}
                    </button>
                  </form>
                </div>
              </>
            )}

            {/* ── Data ── */}
            {tab === 'data' && (
              <>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Download my data</p>
                    <p className="text-xs text-gray-500 mt-0.5">Download your profile and all chat history as JSON.</p>
                  </div>
                  <button
                    onClick={exportData}
                    className="flex-shrink-0 px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Download
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Delete all chats</p>
                    <p className="text-xs text-gray-500 mt-0.5">Permanently removes all conversations. Your profile is kept.</p>
                  </div>
                  {confirmChats ? (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={handleDeleteAllChats}
                        disabled={deletingChats}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletingChats ? 'Deleting…' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmChats(false)}
                        className="px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmChats(true)}
                      className="flex-shrink-0 px-4 py-1.5 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Delete account</p>
                    <p className="text-xs text-gray-500 mt-0.5">Permanently deletes your account, profile, and all data.</p>
                  </div>
                  {confirmAccount ? (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={onDeleteAccount}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Delete account
                      </button>
                      <button
                        onClick={() => setConfirmAccount(false)}
                        className="px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmAccount(true)}
                      className="flex-shrink-0 px-4 py-1.5 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
