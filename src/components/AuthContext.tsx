'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginAction, logoutAction, getCurrentUserAction } from '@/src/actions/auth';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  department: string;
  title: string;
  tokensBalance: number;
  savedSignature?: string | null;
  sickLeaveBalance?: number;
  annualLeaveBalance?: number;
}

interface AuthContextProps {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
  isLoginOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const openLogin = () => setIsLoginOpen(true);
  const closeLogin = () => setIsLoginOpen(false);

  // Restore session from BFF secure cookie on mount
  useEffect(() => {
    async function initAuth() {
      try {
        const currentUser = await getCurrentUserAction();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Failed to restore auth session', err);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await loginAction(email, password);
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true };
      } else {
        return { success: false, error: res.error || 'Login failed' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection error' };
    }
  };

  const logout = async () => {
    try {
      await logoutAction();
      setUser(null);
    } catch (err) {
      console.error('Failed to logout', err);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUserAction();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (err) {
      console.error('Failed to refresh user data', err);
    }
  };

  const token = user ? 'session_active_masked' : null;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, refreshUser, isLoginOpen, openLogin, closeLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
