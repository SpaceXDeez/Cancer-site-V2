import React from 'react';
import AuthForm from './AuthForm.jsx';

export default function LoginModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <img src="/images/boy-bell-circle.png" alt="" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-bold text-brand-teal-dark leading-tight">Bell Guide</p>
            <p className="text-xs text-[#5a7a8a]">Sign in to access your chats &amp; profile</p>
          </div>
        </div>

        <AuthForm onSuccess={onClose} />

        <p className="text-center text-xs text-gray-400 mt-5 leading-relaxed">
          Your data is stored privately on this server and never shared with third parties.
        </p>
      </div>
    </div>
  );
}
