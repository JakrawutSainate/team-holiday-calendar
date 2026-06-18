'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  department: string;
  title: string;
  tokensBalance: number;
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
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const openLogin = () => setIsLoginOpen(true);
  const closeLogin = () => setIsLoginOpen(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('holidayhq_token');
    const savedUser = localStorage.getItem('holidayhq_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1/graphql';
      
      const query = `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            token
            user {
              id
              name
              email
              role
              avatarUrl
              department
              title
              tokensBalance
            }
          }
        }
      `;

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { email, password },
        }),
      });

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        return { success: false, error: result.errors[0].message };
      }

      const { token: sessionToken, user: userData } = result.data.login;
      
      setToken(sessionToken);
      setUser(userData);
      
      localStorage.setItem('holidayhq_token', sessionToken);
      localStorage.setItem('holidayhq_user', JSON.stringify(userData));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection error' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('holidayhq_token');
    localStorage.removeItem('holidayhq_user');
  };

  const refreshUser = async () => {
    if (!token || !user) return;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1/graphql';
      
      const query = `
        query GetTeamMembers {
          getTeamMembers {
            id
            name
            email
            role
            avatarUrl
            department
            title
            tokensBalance
          }
        }
      `;

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();
      if (result.data && result.data.getTeamMembers) {
        const updated = result.data.getTeamMembers.find((m: User) => m.id === user.id);
        if (updated) {
          setUser(updated);
          localStorage.setItem('holidayhq_user', JSON.stringify(updated));
        }
      }
    } catch (err) {
      console.error('Failed to refresh user data', err);
    }
  };

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
