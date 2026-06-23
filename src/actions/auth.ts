'use server';

import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/src/libs/session';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}

// Base URL for all backend calls — set INTERNAL_API_URL to just the host, e.g.
// "https://mybackend.railway.app"  (no trailing slash, no path)
const BACKEND_BASE = (process.env.INTERNAL_API_URL || 'http://localhost:8080').replace(/\/+$/, '');

export async function loginAction(emailInput: string, passwordInput: string) {
  // Input Validation / Sanitization using Zod (OWASP Prevention against Injection / Improper Inputs)
  const validation = loginSchema.safeParse({ email: emailInput, password: passwordInput });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { email, password } = validation.data;

  try {
    const API_URL = `${BACKEND_BASE}/api/v1/auth/login`;

    // Perform Server-to-Server API Request (BFF pattern hides the actual backend endpoint and tokens)
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Invalid credentials' };
    }

    const data = await response.json(); // { token, user }

    // Save to iron-session (Secure encrypted cookie, HttpOnly, SameSite=Strict)
    const session = await getSession();
    session.token = data.token;
    session.user = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      avatarUrl: data.user.avatarUrl,
      department: data.user.department,
      title: data.user.title,
      tokensBalance: data.user.tokensBalance,
    };
    await session.save();

    // Send only public user profile back, masked JWT stays safely in the cookie
    return { success: true, user: session.user };
  } catch (error: any) {
    console.error('BFF Login Error:', error);
    return { success: false, error: 'Connection failed. Please check backend server status.' };
  }
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  return { success: true };
}

export async function getCurrentUserAction() {
  const session = await getSession();
  if (!session.user) {
    return null;
  }
  return session.user;
}

export async function runGraphQLAction(query: string, variables: Record<string, any> = {}) {
  try {
    const session = await getSession();
    const token = session.token;

    const backendUrl = `${BACKEND_BASE}/api/v1/graphql`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
      cache: 'no-store',
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('BFF Action GraphQL Error:', error);
    return { errors: [{ message: 'Failed to communicate with backend services.' }] };
  }
}

