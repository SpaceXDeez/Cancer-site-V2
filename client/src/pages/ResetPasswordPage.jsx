import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function ResetPasswordPage({ token }) {
  const { saveAuth } = useAuth();
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPw.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setError('Passwords do not match.'); return; }
    setError(null);
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
      saveAuth(data.token, data.user);
      window.location.href = '/';
    } catch {
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Set new password</h2>
          <p className="text-sm text-gray-500 mt-1">Choose a new password for your account.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <input
              type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
              required autoComplete="new-password" placeholder="At least 8 characters"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
            <input
              type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              required autoComplete="new-password" placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-sm">{error}</div>
          )}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors shadow-sm">
            {loading ? 'Updating…' : 'Set new password'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-5">
          <a href="/" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
            ← Back to sign in
          </a>
        </p>
      </div>
    </div>
  );
}
