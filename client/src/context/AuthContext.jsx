import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('es_token'));
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('es_user')); } catch { return null; }
  });

  const saveAuth = useCallback((newToken, newUser) => {
    localStorage.setItem('es_token', newToken);
    localStorage.setItem('es_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    ['es_token','es_user','es_profile','es_chats','es_current','es_visited'].forEach(k =>
      localStorage.removeItem(k)
    );
    setToken(null);
    setUser(null);
  }, []);

  // Fetch wrapper that attaches the Bearer token and auto-logs out on 401
  const authFetch = useCallback(async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.status === 401) {
      logout();
      throw new Error('Session expired. Please log in again.');
    }
    return res;
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{ token, user, saveAuth, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
