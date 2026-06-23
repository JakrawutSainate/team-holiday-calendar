'use server';

import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/src/libs/session';
import { z } from 'zod';
import { loginUser, resolveGraphQL } from '@/src/libs/db/resolvers';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}

const INTERNAL_API_URL = process.env.INTERNAL_API_URL ? process.env.INTERNAL_API_URL.replace(/\/+$/, '') : '';

export async function loginAction(emailInput: string, passwordInput: string) {
  const validation = loginSchema.safeParse({ email: emailInput, password: passwordInput });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { email, password } = validation.data;

  if (INTERNAL_API_URL) {
    try {
      const loginUrl = `${INTERNAL_API_URL}/api/v1/auth/login`;
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        cache: 'no-store',
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return { success: false, error: errData.error || 'Invalid credentials' };
      }

      const data = await response.json(); // { token, user }
      const session = await getSession();
      session.token = data.token;
      session.user = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        avatarUrl: data.user.avatarUrl ?? null,
        department: data.user.department,
        title: data.user.title,
        tokensBalance: data.user.tokensBalance,
      };
      await session.save();

      return { success: true, user: session.user };
    } catch (error: any) {
      console.error('BFF Login Error:', error);
      return { success: false, error: 'Connection failed. Please check backend server status.' };
    }
  }

  try {
    const user = await loginUser(email, password);

    const session = await getSession();
    session.token = null;
    session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl ?? null,
      department: user.department,
      title: user.title,
      tokensBalance: user.tokensBalance,
    };
    await session.save();

    return { success: true, user: session.user };
  } catch (error: any) {
    console.error('Login Error:', error);
    return { success: false, error: error.message || 'Connection failed.' };
  }
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  return { success: true };
}

export async function getCurrentUserAction() {
  const session = await getSession();
  if (!session.user) return null;
  return session.user;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runGraphQLAction(query: string, variables: Record<string, any> = {}): Promise<any> {
  const session = await getSession();

  if (INTERNAL_API_URL) {
    try {
      const graphqlUrl = `${INTERNAL_API_URL}/api/v1/graphql`;
      const token = session.token;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(graphqlUrl, {
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

  try {
    const data = await resolveGraphQL(query, variables, session.user?.id);
    return { data };
  } catch (error: any) {
    console.error('GraphQL Action Error:', error);
    return { errors: [{ message: error.message || 'Failed to communicate with backend services.' }] };
  }
}
