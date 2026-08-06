import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

// Reusable form used by both LoginModal and the standalone LoginPage
export default function AuthForm({ onSuccess, compact = false }) {
  const { saveAuth } = useAuth();
  const [mode, setMode]         = useState('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  // Only expose test-account option when URL contains ?dev
  const showDevOption = new URLSearchParams(window.location.search).has('dev');
  const [isTest, setIsTest]     = useState(false);
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res  = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, ...(mode === 'register' && { isTest }) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
      saveAuth(data.token, data.user);
      onSuccess?.();
    } catch {
      setError('Could not connect to the server. Is it running?');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTestAccount() {
    setError(null);
    setLoading(true);
    try {
      const rand  = () => Math.random().toString(36).slice(2);
      const creds = { email: `test_${rand()}@dev.local`, password: rand() + rand(), isTest: true };
      const res   = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
      saveAuth(data.token, data.user);
      onSuccess?.();
    } catch {
      setError('Could not connect to the server. Is it running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {!compact && (
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'login'
              ? 'Sign in to access your chats and patient profile.'
              : 'Your account keeps your information private and accessible across devices.'}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {mode === 'register' && showDevOption && (
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isTest}
              onChange={e => setIsTest(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-400"
            />
            <span className="text-sm text-gray-600">
              This is a <span className="font-medium text-amber-600">test / developer account</span>
              <span className="block text-xs text-gray-400 mt-0.5">Check this if you're testing the app, not a real patient or family member.</span>
            </span>
          </label>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors shadow-sm"
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        {showDevOption && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center">
              <span className="bg-white px-2 text-xs text-gray-400">dev shortcut</span>
            </div>
          </div>
        )}
        {showDevOption && (
          <button
            type="button"
            onClick={handleCreateTestAccount}
            disabled={loading}
            className="w-full border border-amber-300 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 text-amber-700 font-medium py-2 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Please wait…' : 'One-click test account'}
          </button>
        )}
      </form>

      <p className="text-center text-sm text-gray-500 mt-5">
        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
        <button
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
          className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          {mode === 'login' ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </div>
  );
}
