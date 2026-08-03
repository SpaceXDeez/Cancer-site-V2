import React, { useState, useEffect, useCallback } from 'react';
import ChatSidebar from './components/ChatSidebar.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import Questionnaire from './components/Questionnaire.jsx';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function makeChat() {
  return { id: uid(), name: 'New Chat', createdAt: new Date().toISOString(), messages: [] };
}

function loadJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

export default function App() {
  const [profile, setProfile] = useState(() => loadJson('es_profile', {}));
  const [chats, setChats]     = useState(() => loadJson('es_chats', []));
  const [currentId, setCurrentId] = useState(() => localStorage.getItem('es_current') || null);
  const [showQ, setShowQ]         = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  // First-visit detection
  useEffect(() => {
    if (!localStorage.getItem('es_visited')) {
      setIsFirstVisit(true);
      setShowQ(true);
    }
  }, []);

  // Persistence
  useEffect(() => { localStorage.setItem('es_profile', JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem('es_chats',   JSON.stringify(chats));   }, [chats]);
  useEffect(() => { if (currentId) localStorage.setItem('es_current', currentId); }, [currentId]);

  const currentChat = chats.find(c => c.id === currentId) || null;

  const handleNewChat = useCallback(() => {
    const chat = makeChat();
    setChats(prev => [chat, ...prev]);
    setCurrentId(chat.id);
  }, []);

  const handleDeleteChat = useCallback((id) => {
    setChats(prev => {
      const next = prev.filter(c => c.id !== id);
      if (currentId === id) {
        setCurrentId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  }, [currentId]);

  const handleRenameChat = useCallback((id, name) => {
    setChats(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  }, []);

  const handleUpdateMessages = useCallback((chatId, messages) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages } : c));
  }, []);

  const handleSaveProfile = useCallback((newProfile) => {
    setProfile(newProfile);
    localStorage.setItem('es_visited', '1');
    setShowQ(false);
    setIsFirstVisit(false);
    setChats(prev => {
      if (prev.length === 0) {
        const chat = makeChat();
        setCurrentId(chat.id);
        return [chat];
      }
      return prev;
    });
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <ChatSidebar
        chats={chats}
        currentChatId={currentId}
        profile={profile}
        onNewChat={handleNewChat}
        onSelectChat={setCurrentId}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onOpenProfile={() => setShowQ(true)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {currentChat ? (
          <ChatWindow
            key={currentChat.id}
            chat={currentChat}
            profile={profile}
            onUpdateMessages={(msgs) => handleUpdateMessages(currentChat.id, msgs)}
            onRenameChat={(name) => handleRenameChat(currentChat.id, name)}
          />
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
    </div>
  );
}

function EmptyState({ onNewChat }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-white">
      <div className="text-center max-w-sm px-6">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-blue-100">
          <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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
