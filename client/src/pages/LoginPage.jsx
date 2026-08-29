import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { saveAuth } = useAuth();
  const [mode, setMode]       = useState('login'); // 'login' | 'register'
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res  = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
      saveAuth(data.token, data.user);
    } catch {
      setError('Could not connect to the server. Is it running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / brand */}
        <div className="text-center mb-8">
          <img src="/images/boy-bell-circle.png" alt="" className="w-20 h-20 rounded-full object-cover mx-auto mb-4 shadow-lg" />
          <img src="/images/wordmark-wide.png" alt="Bell Guide" className="h-10 w-auto mx-auto mb-1" />
          <p className="text-[#5a7a8a] text-sm mt-1">AI Support Assistant</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {mode === 'login'
              ? 'Sign in to access your chats and patient profile.'
              : 'Your account keeps your information private and accessible across devices.'}
          </p>

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
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-teal hover:bg-brand-teal-dark disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors shadow-sm"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
              className="text-brand-teal hover:text-brand-teal-dark font-medium transition-colors"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-slate-500 mt-5 px-4 leading-relaxed">
          Your data is stored locally on this server and never shared with third parties.
          All AI responses are for educational purposes only — not medical advice.
        </p>
      </div>
    </div>
  );
}
