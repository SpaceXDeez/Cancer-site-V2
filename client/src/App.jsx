import React, { useState, useEffect, useCallback } from 'react';
import { useAuth }    from './context/AuthContext.jsx';
import HomePage       from './pages/HomePage.jsx';
import ChatSidebar    from './components/ChatSidebar.jsx';
import ChatWindow     from './components/ChatWindow.jsx';
import Questionnaire  from './components/Questionnaire.jsx';
import LoginModal     from './components/LoginModal.jsx';
import SettingsModal  from './components/SettingsModal.jsx';
import TutorialOverlay from './components/TutorialOverlay.jsx';
import ErrorBoundary   from './components/ErrorBoundary.jsx';

export default function App() {
  const { token, user, authFetch, logout } = useAuth();

  const [profile, setProfile]   = useState({});
  const [chats, setChats]       = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [view, setView]             = useState('home');
  const [showQ, setShowQ]           = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [appLoading, setAppLoading]     = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [showSettings, setShowSettings]     = useState(false);
  const [showReturnBanner, setShowReturnBanner] = useState(false);
  const [showTutorial, setShowTutorial]         = useState(false);
  const [tutorialSettingsTab, setTutorialSettingsTab] = useState(null);

  // Load profile + chats whenever the user logs in
  useEffect(() => {
    if (!token) {
      setProfile({});
      setChats([]);
      setCurrentId(null);
      setView('home');
      return;
    }
    setAppLoading(true);
    Promise.all([
      authFetch('/api/profile').then(r => r.json()),
      authFetch('/api/chats').then(r => r.json()),
    ]).then(([profileData, chatsData]) => {
      const loadedProfile = profileData.profile || {};
      setProfile(loadedProfile);
      const loadedChats = chatsData.chats || [];
      setChats(loadedChats);
      if (Object.keys(loadedProfile).length === 0) {
        setIsFirstVisit(true);
        setShowQ(true);
      } else if (!sessionStorage.getItem('returnBannerShown')) {
        // Returning user with existing profile — remind once per session
        setShowReturnBanner(true);
        sessionStorage.setItem('returnBannerShown', '1');
      }
      if (loadedChats.length > 0) {
        setCurrentId(loadedChats[0].id);
        setView('chat');
      }
    }).catch(console.error)
      .finally(() => setAppLoading(false));
  }, [token]);

  const currentChat = chats.find(c => c && c.id === currentId) || null;

  const handleNewChat = useCallback(async () => {
    try {
      const res  = await authFetch('/api/chats', { method: 'POST', body: JSON.stringify({ name: 'New Chat' }) });
      if (!res.ok) throw new Error(`Failed to create chat (${res.status})`);
      const data = await res.json();
      if (!data.chat?.id) throw new Error('Unexpected response from server');
      setChats(prev => [data.chat, ...prev]);
      setCurrentId(data.chat.id);
      setView('chat');
    } catch (err) { console.error(err); }
  }, [authFetch]);

  const handleDeleteChat = useCallback(async (id) => {
    try {
      await authFetch(`/api/chats/${id}`, { method: 'DELETE' });
      setChats(prev => {
        const next = prev.filter(c => c.id !== id);
        if (currentId === id) setCurrentId(next.length > 0 ? next[0].id : null);
        return next;
      });
    } catch (err) { console.error(err); }
  }, [authFetch, currentId]);

  const handleRenameChat = useCallback(async (id, name) => {
    try {
      await authFetch(`/api/chats/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) });
      setChats(prev => prev.map(c => c.id === id ? { ...c, name } : c));
    } catch (err) { console.error(err); }
  }, [authFetch]);

  const handleSaveProfile = useCallback(async (newProfile) => {
    try {
      const res = await authFetch('/api/profile', { method: 'PUT', body: JSON.stringify({ profile: newProfile }) });
      if (!res.ok) throw new Error(`Failed to save profile (${res.status})`);
      setProfile(newProfile);
      setShowQ(false);
      const wasFirst = isFirstVisit;
      setIsFirstVisit(false);
      if (chats.length === 0) handleNewChat();
      // Always show tutorial for first-time users regardless of any stale localStorage flag
      if (wasFirst) {
        localStorage.removeItem('tutorialDone');
        setTimeout(() => setShowTutorial(true), 900);
      }
    } catch (err) { console.error(err); }
  }, [authFetch, chats.length, handleNewChat, isFirstVisit]);

  const handleUpdateProfile = useCallback(async (updates) => {
    const merged = { ...profile, ...updates };
    try {
      const res = await authFetch('/api/profile', { method: 'PUT', body: JSON.stringify({ profile: merged }) });
      if (!res.ok) throw new Error(`Failed to update profile (${res.status})`);
      setProfile(merged);
    } catch (err) { console.error(err); }
  }, [authFetch, profile]);

  const handleDeleteAccount = useCallback(async () => {
    try {
      await authFetch('/api/auth/account', { method: 'DELETE' });
    } catch (err) { console.error(err); }
    logout();
  }, [authFetch, logout]);

  const handleDeleteAllChats = useCallback(async () => {
    try {
      await authFetch('/api/chats', { method: 'DELETE' });
      setChats([]);
      setCurrentId(null);
    } catch (err) { console.error(err); }
  }, [authFetch]);

  const handleSaveSettings = useCallback(async (newSettings) => {
    const merged = { ...profile, _settings: newSettings };
    try {
      await authFetch('/api/profile', { method: 'PUT', body: JSON.stringify({ profile: merged }) });
      setProfile(merged);
    } catch (err) { console.error(err); }
  }, [authFetch, profile]);

  const handleSettingsNav = useCallback((tabOrNull) => {
    if (tabOrNull) {
      setShowSettings(true);
      setTutorialSettingsTab(tabOrNull);
    } else {
      setShowSettings(false);
      setTutorialSettingsTab(null);
    }
  }, []);

  // Logged-out: show home page with login modal
  if (!token) {
    return (
      <div className="flex h-screen overflow-hidden">
        <HomePage
          isLoggedIn={false}
          user={null}
          onLoginClick={() => setShowLoginModal(true)}
          onStartChat={() => setShowLoginModal(true)}
        />
        {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
      </div>
    );
  }

  if (appLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={closeSidebar} />
      )}

      {/* Floating hamburger — mobile only, hidden when sidebar is open */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-3 left-3 z-30 md:hidden bg-slate-800/95 text-white p-2.5 rounded-xl shadow-lg"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      <ChatSidebar
        chats={chats}
        currentChatId={currentId}
        profile={profile}
        user={user}
        view={view}
        sidebarOpen={sidebarOpen}
        onNewChat={() => { handleNewChat(); closeSidebar(); }}
        onSelectChat={(id) => { setCurrentId(id); setView('chat'); closeSidebar(); }}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onOpenProfile={() => {
          // Don't open settings over the first-visit questionnaire
          if (showQ && isFirstVisit) return;
          setShowSettings(true); closeSidebar();
        }}
        onOpenMedicalProfile={() => { setShowQ(true); closeSidebar(); }}
        onLogout={logout}
        onSetView={(v) => { setView(v); closeSidebar(); }}
        onCloseSidebar={closeSidebar}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {view === 'home' ? (
          <HomePage
            isLoggedIn={true}
            user={user}
            onLoginClick={null}
            onStartChat={() => {
              if (currentChat) setView('chat');
              else handleNewChat();
            }}
          />
        ) : currentChat ? (
          <ErrorBoundary key={currentChat.id}>
            <ChatWindow
              key={currentChat.id}
              chat={currentChat}
              profile={profile}
              authFetch={authFetch}
              onRenameChat={(name) => handleRenameChat(currentChat.id, name)}
              onUpdateProfile={handleUpdateProfile}
            />
          </ErrorBoundary>
        ) : (
          <EmptyState onNewChat={handleNewChat} />
        )}
      </main>

      {showQ && (
        <Questionnaire
          profile={profile}
          isFirstVisit={isFirstVisit}
          onSave={handleSaveProfile}
          onClose={isFirstVisit ? null : () => setShowQ(false)}
        />
      )}

      {/* Return-user reminder banner — shown once per session */}
      {showReturnBanner && (        <div className="fixed left-1/2 -translate-x-1/2 z-50 bg-white border border-blue-200 rounded-2xl shadow-xl px-5 py-3.5 flex items-center gap-3 max-w-sm w-[calc(100vw-2rem)]" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-gray-700 flex-1 leading-relaxed">
            Keep your profile current — adding new symptoms, blood tests, treatments, or procedures helps the AI give better answers.
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => { setShowReturnBanner(false); setShowSettings(true); }}
              className="text-xs text-blue-600 font-medium hover:text-blue-800 whitespace-nowrap"
            >
              Update
            </button>
            <button onClick={() => setShowReturnBanner(false)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showSettings && !showQ && (
        <SettingsModal
          user={user}
          profile={profile}
          authFetch={authFetch}
          onSave={handleSaveSettings}
          onDeleteAllChats={handleDeleteAllChats}
          onDeleteAccount={handleDeleteAccount}
          onOpenQuestionnaire={() => { setShowSettings(false); setShowQ(true); }}
          onClose={() => { setShowSettings(false); setTutorialSettingsTab(null); }}
          forcedTab={tutorialSettingsTab}
        />
      )}

      {showTutorial && !showQ && (
        <TutorialOverlay
          onDone={() => setShowTutorial(false)}
          onSettingsNav={handleSettingsNav}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
      )}
    </div>
  );
}

function EmptyState({ onNewChat }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-white">
      <div className="text-center max-w-sm px-6">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-blue-100">
          <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Start a conversation</h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Ask about treatment options, side effects, clinical trials, or anything related to Ewing's sarcoma.
        </p>
        <button
          onClick={onNewChat}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          New Chat
        </button>
      </div>
    </div>
  );
}

