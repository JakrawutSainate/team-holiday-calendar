'use server';

import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/src/libs/session';
import { z } from 'zod';
import { loginUser, resolveGraphQL } from '@/src/libs/db/resolvers';
import { prisma } from '@/src/libs/db/prisma';

async function createAuditLog(userId: string, userName: string, action: string, details: string) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        userName,
        action,
        details,
      },
    });
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
}

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}

const getInternalApiUrl = (): string => {
  let url = process.env.INTERNAL_API_URL || '';
  if (url) {
    url = url
      .replace(/\/api\/v1\/auth\/login\/?$/, '')
      .replace(/\/api\/v1\/graphql\/?$/, '')
      .replace(/\/api\/v1\/?$/, '')
      .replace(/\/+$/, '');
  }
  return url;
};

const INTERNAL_API_URL = getInternalApiUrl();

export async function loginAction(emailInput: string, passwordInput: string) {
  const validation = loginSchema.safeParse({ email: emailInput, password: passwordInput });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { email, password } = validation.data;

  if (INTERNAL_API_URL) {
    try {
      const loginUrl = `${INTERNAL_API_URL}/api/v1/auth/login`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
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
          savedSignature: data.user.savedSignature ?? null,
          sickLeaveBalance: data.user.sickLeaveBalance ?? 30,
          annualLeaveBalance: data.user.annualLeaveBalance ?? 6,
        };
        await session.save();
        return { success: true, user: session.user };
      } else {
        const errData = await response.json().catch(() => ({}));
        return { success: false, error: errData.error || 'Invalid credentials' };
      }
    } catch (error: any) {
      console.warn('BFF Login failed to connect to Go backend, falling back to local Prisma:', error);
      // Fall through to local Prisma resolver below
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
      savedSignature: user.savedSignature ?? null,
      sickLeaveBalance: user.sickLeaveBalance ?? 30,
      annualLeaveBalance: user.annualLeaveBalance ?? 6,
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
  const queryClean = query.trim();

  // 1. Bypass Go backend for new queries not defined in Go
  const shouldBypassBFF = false;

  let result: any = null;

  if (INTERNAL_API_URL && !shouldBypassBFF) {
    try {
      const graphqlUrl = `${INTERNAL_API_URL}/api/v1/graphql`;
      const token = session.token;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (json && json.errors && json.errors.some((e: any) => e.message?.includes('unsupported GraphQL operation'))) {
          result = null;
        } else {
          result = json;
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        result = { errors: [{ message: errData.error || 'Backend request failed.' }] };
      }
    } catch (error: any) {
      console.warn('BFF Action GraphQL Error (falling back to local Prisma):', error);
      // Fall through to local Prisma resolver below
    }
  }

  if (!result) {
    try {
      const data = await resolveGraphQL(query, variables, session.user?.id);
      result = { data };
    } catch (error: any) {
      console.error('GraphQL Action Error:', error);
      result = { errors: [{ message: error.message || 'Failed to communicate with backend services.' }] };
    }
  }

  // 2. Intercept and log admin changes if action is successful
  if (result && !result.errors && session.user) {
    if (queryClean.includes('updateMaxOffAllowed')) {
      await createAuditLog(
        session.user.id,
        session.user.name,
        'UPDATE_CAPACITY',
        `Changed global capacity limit to ${variables.maxOffAllowed} people`
      );
    } else if (queryClean.includes('adminAddTokens')) {
      await createAuditLog(
        session.user.id,
        session.user.name,
        'ADD_TOKENS',
        `Added ${variables.amount} tokens to user ID ${variables.userId}. Description: ${variables.description || 'N/A'}`
      );
    } else if (queryClean.includes('approveLeaveDocument')) {
      await createAuditLog(
        session.user.id,
        session.user.name,
        'APPROVE_LEAVE',
        `Approved leave document ID: ${variables.id}`
      );
    } else if (queryClean.includes('rejectLeaveDocument')) {
      await createAuditLog(
        session.user.id,
        session.user.name,
        'REJECT_LEAVE',
        `Rejected leave document ID: ${variables.id}. Reason: ${variables.rejectReason || 'N/A'}`
      );
    } else if (queryClean.includes('deleteLeaveDocument')) {
      await createAuditLog(
        session.user.id,
        session.user.name,
        'DELETE_DOCUMENT',
        `Deleted leave document ID: ${variables.id}`
      );
    } else if (queryClean.includes('updateTeamMemberProfile')) {
      await createAuditLog(
        session.user.id,
        session.user.name,
        'UPDATE_PROFILE',
        `Updated profile info for user ID ${variables.id}. New details - Name: ${variables.name}, Dept: ${variables.department}, Title: ${variables.title}`
      );
    }
  }

  return result;
}
