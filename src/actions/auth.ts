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

export async function loginAction(emailInput: string, passwordInput: string) {
  const validation = loginSchema.safeParse({ email: emailInput, password: passwordInput });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { email, password } = validation.data;

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
  try {
    const session = await getSession();
    const data = await resolveGraphQL(query, variables, session.user?.id);
    return { data };
  } catch (error: any) {
    console.error('GraphQL Action Error:', error);
    return { errors: [{ message: error.message || 'Failed to communicate with backend services.' }] };
  }
}
